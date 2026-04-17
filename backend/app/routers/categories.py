import io
import csv
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.category import Category, CategoryRule
from app.models.invoice import Invoice
from app.schemas.category import CategoryResponse, CategoryImportResult

router = APIRouter(prefix="/categories", tags=["categories"])

SUPPORTED_RULE_TYPES = {"seller_name_contains", "seller_tax_id", "item_name_contains", "amount_range"}
REQUIRED_FIELDS = {"category_code", "category_name", "rule_type", "rule_value"}


@router.post("/import", response_model=CategoryImportResult)
async def import_categories(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()

    # Try UTF-8 first, then Big5
    text = None
    for encoding in ("utf-8-sig", "utf-8", "big5"):
        try:
            text = content.decode(encoding)
            break
        except (UnicodeDecodeError, ValueError):
            continue

    if text is None:
        raise HTTPException(status_code=422, detail="Cannot decode CSV file (try UTF-8 or Big5)")

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise HTTPException(status_code=422, detail="Empty CSV file")

    missing = REQUIRED_FIELDS - set(reader.fieldnames)
    if missing:
        raise HTTPException(status_code=422, detail=f"Missing required fields: {missing}")

    created = 0
    updated = 0
    skipped = 0
    warnings = []

    # Group rows by category_code
    from collections import defaultdict
    groups: dict = defaultdict(list)

    rows = list(reader)
    for row in rows:
        code = (row.get("category_code") or "").strip()
        if not code:
            skipped += 1
            continue
        rt = (row.get("rule_type") or "").strip()
        if rt not in SUPPORTED_RULE_TYPES:
            warnings.append(f"Skipped unsupported rule_type '{rt}' for category '{code}'")
            skipped += 1
            continue
        groups[code].append(row)

    for code, rows_for_code in groups.items():
        sample = rows_for_code[0]
        cat_name = (sample.get("category_name") or "").strip()
        account_code = (sample.get("account_code") or "").strip() or None

        existing = db.query(Category).filter(Category.code == code).first()
        if existing:
            existing.name = cat_name
            existing.account_code = account_code
            # Replace rules
            db.query(CategoryRule).filter(CategoryRule.category_id == existing.id).delete()
            cat = existing
            updated += 1
        else:
            cat = Category(code=code, name=cat_name, account_code=account_code)
            db.add(cat)
            db.flush()
            created += 1

        for row in rows_for_code:
            rt = (row.get("rule_type") or "").strip()
            rv = (row.get("rule_value") or "").strip()
            priority = int(row.get("priority") or 10)
            db.add(CategoryRule(category_id=cat.id, rule_type=rt, rule_value=rv, priority=priority))

    db.commit()
    return CategoryImportResult(created=created, updated=updated, skipped=skipped, warnings=warnings)


@router.get("/", response_model=list[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    cats = db.query(Category).all()
    return cats


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(category_id: int, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return cat


@router.delete("/{category_id}", status_code=204)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    # Detach invoices
    db.query(Invoice).filter(Invoice.category_id == category_id).update(
        {"category_id": None}, synchronize_session=False
    )
    db.delete(cat)
    db.commit()
