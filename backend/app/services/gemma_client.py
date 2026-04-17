"""
Gemma 4 Vision client for invoice OCR and LLM classification.
Uses OpenAI-compatible API.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Optional

from openai import AsyncOpenAI

from app.config import settings

logger = logging.getLogger(__name__)

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            base_url=settings.gemma_endpoint_url,
            api_key=settings.gemma_api_key,
        )
    return _client


_EXTRACTION_SYSTEM = """You are an OCR assistant for Taiwan e-invoices (電子發票/紙本發票).
Extract the following fields from the invoice image and return a JSON object:
- invoice_number (發票號碼, format: 2 letters + 8 digits, e.g. AB12345678)
- purchase_date (消費日期, ISO format YYYY-MM-DD)
- random_code (隨機碼, 4 digits — appears after the label "隨機碼:" on the receipt)
- seller_name (賣方名稱/商店名稱 — the store or company that issued the invoice)
- seller_tax_id (賣方統一編號, 8 digits — labelled "賣方:" on the receipt; the seller/store tax ID)
- buyer_tax_id (買方統一編號, 8 digits — labelled "買方:" on the receipt; null if B2C or all zeros)
- amount_untaxed (未稅額, number)
- amount_tax (稅額, number)
- amount_total (總金額, number)
- items (品項清單, array of {item_name, quantity, unit_price, amount})

IMPORTANT: On Taiwan e-invoice receipts the line "賣方:XXXXXXXX 買方:YYYYYYYY" means
seller_tax_id=XXXXXXXX and buyer_tax_id=YYYYYYYY. Do NOT swap these two values.
The random_code (隨機碼) is a separate 4-digit field and must not be left empty if visible.

Return ONLY a valid JSON object. If a field cannot be determined, use null."""

_CLASSIFY_SYSTEM = """你是一個費用分類助理。
請根據發票資訊，從提供的費用分類清單中選擇最適合的分類。

請回傳一個 JSON 物件，包含以下欄位：
- category_code: 分類代碼（從清單中選擇）
- confidence: 信心值（0.0 到 1.0）
- reasoning: 中文說明為何選擇此分類（一句話）

只回傳 JSON，不要加說明文字。"""


async def extract_from_image(image_base64: str, hint_json: Optional[dict] = None) -> dict:
    """
    Call Gemma 4 Vision to extract invoice data from a base64-encoded image.
    hint_json: optional partial data already extracted (e.g. from QR) to guide OCR.
    Returns a dict with extracted fields.
    """
    hint_text = ""
    if hint_json:
        known = {k: v for k, v in hint_json.items() if v is not None}
        if known:
            hint_text = f"\n\n以下欄位已由 QR code 確認，請以此為準：\n{json.dumps(known, ensure_ascii=False)}"

    system_msg = _EXTRACTION_SYSTEM + hint_text

    try:
        response = await _get_client().chat.completions.create(
            model=settings.gemma_model_name,
            messages=[
                {"role": "system", "content": system_msg},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}"
                            },
                        },
                        {"type": "text", "text": "請擷取此發票的所有欄位。"},
                    ],
                },
            ],
            temperature=0.1,
            max_tokens=2048,
            extra_body={"chat_template_kwargs": {"enable_thinking": False}},
        )
        raw = response.choices[0].message.content or ""
        return _parse_json_response(raw)
    except Exception as e:
        logger.error("Gemma extraction failed: %s", e)
        return {}


async def classify_with_llm(
    seller_name: Optional[str],
    seller_tax_id: Optional[str],
    items: list[dict],
    amount_total: Optional[float],
    categories: list[dict],
) -> dict:
    """
    Use Gemma 4 LLM to classify an invoice into an expense category.
    Returns {category_code, confidence, reasoning}.
    """
    categories_text = "\n".join(
        f"- {c['code']}: {c['name']}" + (f"（{c.get('description', '')}）" if c.get("description") else "")
        for c in categories
    )

    invoice_summary = {
        k: v
        for k, v in {
            "seller_name": seller_name,
            "seller_tax_id": seller_tax_id,
            "items": items,
            "amount_total": amount_total,
        }.items()
        if v is not None
    }

    user_msg = f"""發票資訊：
{json.dumps(invoice_summary, ensure_ascii=False, indent=2)}

可用費用類別：
{categories_text}

請選出最適合的費用類別。"""

    try:
        response = await _get_client().chat.completions.create(
            model=settings.gemma_model_name,
            messages=[
                {"role": "system", "content": _CLASSIFY_SYSTEM},
                {"role": "user", "content": user_msg},
            ],
            temperature=0.1,
            max_tokens=256,
            extra_body={"chat_template_kwargs": {"enable_thinking": False}},
        )
        raw = response.choices[0].message.content or ""
        return _parse_json_response(raw)
    except Exception as e:
        logger.error("Gemma classification failed: %s", e)
        return {}


def _parse_json_response(content: str) -> dict:
    """Parse JSON from LLM response, handling markdown code blocks."""
    content = content.strip()
    # Remove ```json ... ``` fences (non-greedy, handles closing fence)
    match = re.search(r"```(?:json)?\s*([\s\S]+?)```", content)
    if match:
        content = match.group(1).strip()
    else:
        # Fallback: strip opening fence even if closing fence is absent
        content = re.sub(r"^```(?:json)?\s*", "", content)
    # Find first {...}
    match = re.search(r"\{[\s\S]+\}", content)
    if match:
        content = match.group(0)
    try:
        return json.loads(content)
    except json.JSONDecodeError as e:
        logger.warning("JSON parse failed: %s | raw: %.200s", e, content)
        return {}
