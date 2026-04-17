from typing import Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.bundle import Bundle
from app.models.invoice import Invoice
from app.schemas.bundle import BundleCreate, BundleUpdate, BundleResponse

router = APIRouter(prefix="/bundles", tags=["bundles"])

LOCKED_STATUSES = {"submitted", "archived"}


def _to_response(bundle: Bundle) -> BundleResponse:
    invoices = bundle.invoices or []
    total = sum(
        (inv.amount_total or Decimal(0)) for inv in invoices
    )
    return BundleResponse(
        id=bundle.id,
        name=bundle.name,
        description=bundle.description,
        status=bundle.status,
        date_from=bundle.date_from,
        date_to=bundle.date_to,
        created_at=bundle.created_at,
        updated_at=bundle.updated_at,
        invoice_count=len(invoices),
        total_amount=total if invoices else None,
    )


@router.post("/", response_model=BundleResponse, status_code=201)
def create_bundle(data: BundleCreate, db: Session = Depends(get_db)):
    bundle = Bundle(**data.model_dump())
    db.add(bundle)
    db.commit()
    db.refresh(bundle)
    return _to_response(bundle)


@router.get("/", response_model=list[BundleResponse])
def list_bundles(db: Session = Depends(get_db)):
    bundles = db.query(Bundle).all()
    return [_to_response(b) for b in bundles]


@router.get("/{bundle_id}", response_model=BundleResponse)
def get_bundle(bundle_id: int, db: Session = Depends(get_db)):
    bundle = db.query(Bundle).filter(Bundle.id == bundle_id).first()
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")
    return _to_response(bundle)


@router.put("/{bundle_id}", response_model=BundleResponse)
def update_bundle(bundle_id: int, data: BundleUpdate, db: Session = Depends(get_db)):
    bundle = db.query(Bundle).filter(Bundle.id == bundle_id).first()
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(bundle, key, value)

    db.commit()
    db.refresh(bundle)
    return _to_response(bundle)


@router.delete("/{bundle_id}", status_code=204)
def delete_bundle(bundle_id: int, db: Session = Depends(get_db)):
    bundle = db.query(Bundle).filter(Bundle.id == bundle_id).first()
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")

    # Detach invoices
    for inv in (bundle.invoices or []):
        inv.bundle_id = None

    db.delete(bundle)
    db.commit()


@router.post("/{bundle_id}/invoices", response_model=dict, status_code=200)
def add_invoice_to_bundle(bundle_id: int, body: dict, db: Session = Depends(get_db)):
    bundle = db.query(Bundle).filter(Bundle.id == bundle_id).first()
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")
    if bundle.status in LOCKED_STATUSES:
        raise HTTPException(status_code=400, detail="Bundle is locked")

    invoice_id = body.get("invoice_id")
    if not invoice_id:
        raise HTTPException(status_code=422, detail="invoice_id required")

    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    invoice.bundle_id = bundle_id
    db.commit()
    return {"ok": True}


@router.delete("/{bundle_id}/invoices/{invoice_id}", status_code=204)
def remove_invoice_from_bundle(bundle_id: int, invoice_id: int, db: Session = Depends(get_db)):
    bundle = db.query(Bundle).filter(Bundle.id == bundle_id).first()
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")
    if bundle.status in LOCKED_STATUSES:
        raise HTTPException(status_code=400, detail="Bundle is locked")

    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id, Invoice.bundle_id == bundle_id
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not in bundle")

    invoice.bundle_id = None
    db.commit()
