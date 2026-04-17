import os
import uuid
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.invoice import Invoice, InvoiceItem
from app.schemas.invoice import ScanRequest, InvoiceResponse, InvoiceUpdate, ClassificationSuggestion
from app.services.ocr_pipeline import run_pipeline
from app.services.classifier import classify
from app.utils.image_utils import save_base64_image
from app.config import settings

router = APIRouter(prefix="/invoices", tags=["invoices"])


@router.post("/scan", response_model=InvoiceResponse, status_code=201)
async def scan_invoice(req: ScanRequest, db: Session = Depends(get_db)):
    # Run OCR pipeline
    data = await run_pipeline(
        image_base64=req.image_base64,
        qr_left=req.qr_left,
        qr_right=req.qr_right,
        barcode_raw=req.barcode_raw,
    )

    # Duplicate detection
    inv_num = data.get("invoice_number")
    rand_code = data.get("random_code")
    if inv_num and rand_code:
        existing = (
            db.query(Invoice)
            .filter(Invoice.invoice_number == inv_num, Invoice.random_code == rand_code)
            .first()
        )
        if existing:
            raise HTTPException(status_code=409, detail="Invoice already exists")

    # Save image
    image_path = None
    if req.image_base64:
        filename = f"{uuid.uuid4()}.jpg"
        image_path = os.path.join(settings.upload_dir, filename)
        save_base64_image(req.image_base64, image_path)

    # Create Invoice record
    invoice = Invoice(
        invoice_number=data.get("invoice_number"),
        random_code=data.get("random_code"),
        purchase_date=data.get("purchase_date"),
        seller_name=data.get("seller_name"),
        seller_tax_id=data.get("seller_tax_id"),
        buyer_tax_id=data.get("buyer_tax_id"),
        amount_untaxed=data.get("amount_untaxed"),
        amount_tax=data.get("amount_tax"),
        amount_total=data.get("amount_total"),
        image_path=image_path,
        raw_qr_left=req.qr_left,
        raw_qr_right=req.qr_right,
        raw_barcode=req.barcode_raw,
        status="pending",
    )

    # Items
    for item_data in (data.get("items") or []):
        invoice.items.append(InvoiceItem(
            item_name=item_data["item_name"],
            quantity=item_data.get("quantity", 1),
            unit_price=item_data.get("unit_price"),
            amount=item_data.get("amount"),
        ))

    db.add(invoice)
    db.flush()  # get invoice.id

    # Auto-classify
    inv_dict = {
        "seller_name": invoice.seller_name,
        "seller_tax_id": invoice.seller_tax_id,
        "items": [{"item_name": i.item_name} for i in invoice.items],
        "amount_total": invoice.amount_total,
    }
    suggestion = await classify(inv_dict, db)
    invoice.category_id = suggestion.category_id
    invoice.classification_source = suggestion.source
    invoice.classification_confidence = suggestion.confidence
    invoice.classification_reasoning = suggestion.reasoning

    db.commit()
    db.refresh(invoice)
    return invoice


@router.get("/", response_model=dict)
def list_invoices(
    bundle_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    q = db.query(Invoice)
    if bundle_id is not None:
        q = q.filter(Invoice.bundle_id == bundle_id)
    if status:
        q = q.filter(Invoice.status == status)
    if category_id is not None:
        q = q.filter(Invoice.category_id == category_id)
    if date_from:
        q = q.filter(Invoice.purchase_date >= date_from)
    if date_to:
        q = q.filter(Invoice.purchase_date <= date_to)

    total = q.count()
    items = q.offset((page - 1) * size).limit(size).all()

    from app.schemas.invoice import InvoiceResponse
    return {
        "total": total,
        "page": page,
        "size": size,
        "items": [InvoiceResponse.model_validate(i) for i in items],
    }


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


@router.put("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(invoice_id: int, data: InvoiceUpdate, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(invoice, key, value)

    db.commit()
    db.refresh(invoice)
    return invoice


@router.delete("/{invoice_id}", status_code=204)
def delete_invoice(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # Remove image file
    if invoice.image_path and os.path.exists(invoice.image_path):
        os.remove(invoice.image_path)

    db.delete(invoice)
    db.commit()


@router.post("/{invoice_id}/classify", response_model=ClassificationSuggestion)
async def reclassify_invoice(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    inv_dict = {
        "seller_name": invoice.seller_name,
        "seller_tax_id": invoice.seller_tax_id,
        "items": [{"item_name": i.item_name} for i in invoice.items],
        "amount_total": invoice.amount_total,
    }
    suggestion = await classify(inv_dict, db)
    return suggestion


@router.get("/{invoice_id}/image")
def get_invoice_image(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice or not invoice.image_path:
        raise HTTPException(status_code=404, detail="Image not found")
    if not os.path.exists(invoice.image_path):
        raise HTTPException(status_code=404, detail="Image file not found")
    return FileResponse(invoice.image_path, media_type="image/jpeg")
