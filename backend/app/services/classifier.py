"""
Invoice expense classifier.
Phase 1: Rule-based matching (seller_tax_id exact match weighted 2x).
Phase 2: LLM fallback when confidence < 0.5.
"""

from typing import Optional
from sqlalchemy.orm import Session
from app.models.category import Category, CategoryRule
from app.schemas.invoice import ClassificationSuggestion


SUPPORTED_RULE_TYPES = {
    "seller_tax_id",
    "seller_name_contains",
    "item_name_contains",
    "amount_range",
}

LLM_CONFIDENCE_THRESHOLD = 0.5


def _rule_match_score(rule: CategoryRule, invoice_data: dict) -> float:
    """Return score if rule matches, else 0."""
    rt = rule.rule_type
    rv = rule.rule_value.strip()

    if rt == "seller_tax_id":
        tax_id = (invoice_data.get("seller_tax_id") or "").strip()
        if tax_id and tax_id == rv:
            return float(rule.priority) * 2  # exact match 2x weight
    elif rt == "seller_name_contains":
        name = (invoice_data.get("seller_name") or "").strip()
        if rv and rv in name:
            return float(rule.priority)
    elif rt == "item_name_contains":
        items = invoice_data.get("items") or []
        for item in items:
            item_name = (item.get("item_name") or "").strip()
            if rv and rv in item_name:
                return float(rule.priority)
    # amount_range: skip for now (complex parsing)
    return 0.0


def classify_by_rules(invoice_data: dict, db: Session) -> Optional[ClassificationSuggestion]:
    """
    Match invoice data against CategoryRules.
    Returns ClassificationSuggestion if confidence >= threshold, else None.
    """
    rules = (
        db.query(CategoryRule)
        .join(Category)
        .order_by(CategoryRule.priority.desc())
        .all()
    )

    # Accumulate scores per category
    scores: dict[int, float] = {}
    cat_map: dict[int, Category] = {}

    for rule in rules:
        if rule.rule_type not in SUPPORTED_RULE_TYPES:
            continue
        score = _rule_match_score(rule, invoice_data)
        if score > 0:
            cat_id = rule.category_id
            scores[cat_id] = scores.get(cat_id, 0.0) + score
            if cat_id not in cat_map:
                cat_map[cat_id] = rule.category

    if not scores:
        return None

    best_id = max(scores, key=lambda k: scores[k])
    best_score = scores[best_id]

    # Normalize score to [0, 1] confidence. Max possible is priority*2 per rule.
    # Use a sigmoid-like normalization: confidence = score / (score + 10)
    confidence = best_score / (best_score + 10.0)

    if confidence < LLM_CONFIDENCE_THRESHOLD:
        return None

    cat = cat_map[best_id]
    return ClassificationSuggestion(
        category_id=best_id,
        category_code=cat.code,
        category_name=cat.name,
        source="rule",
        confidence=round(confidence, 4),
    )


async def classify_by_llm(invoice_data: dict, db: Session) -> ClassificationSuggestion:
    """
    Use Gemma 4 LLM to classify invoice. Returns a ClassificationSuggestion.
    On failure, returns suggestion with confidence=0 and category=None.
    """
    from app.services import gemma_client

    categories = db.query(Category).all()
    cat_list = [{"code": c.code, "name": c.name, "account_code": c.account_code} for c in categories]

    items = [
        {"item_name": i.get("item_name"), "quantity": str(i.get("quantity", 1))}
        for i in (invoice_data.get("items") or [])
    ]

    try:
        result = await gemma_client.classify_with_llm(
            seller_name=invoice_data.get("seller_name"),
            seller_tax_id=invoice_data.get("seller_tax_id"),
            items=items,
            amount_total=float(invoice_data["amount_total"]) if invoice_data.get("amount_total") else None,
            categories=cat_list,
        )

        code = result.get("category_code")
        confidence = float(result.get("confidence", 0.0))
        reasoning = result.get("reasoning")

        # Lookup category by code
        matched_cat = None
        if code:
            matched_cat = db.query(Category).filter(Category.code == code).first()

        return ClassificationSuggestion(
            category_id=matched_cat.id if matched_cat else None,
            category_code=code,
            category_name=matched_cat.name if matched_cat else None,
            source="llm",
            confidence=round(confidence, 4),
            reasoning=reasoning,
        )
    except Exception:
        return ClassificationSuggestion(
            category_id=None,
            category_code=None,
            category_name=None,
            source="llm",
            confidence=0.0,
        )


async def classify(invoice_data: dict, db: Session) -> ClassificationSuggestion:
    """
    Main classification entry point.
    Tries rule engine first; falls back to LLM if confidence too low.
    """
    rule_result = classify_by_rules(invoice_data, db)
    if rule_result is not None:
        return rule_result
    return await classify_by_llm(invoice_data, db)
