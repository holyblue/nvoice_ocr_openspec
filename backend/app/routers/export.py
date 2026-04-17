from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.bundle import Bundle
from app.models.invoice import Invoice
from app.services.exporter import export_bundle_excel, export_bundle_csv, export_invoices_excel

router = APIRouter(prefix="/export", tags=["export"])


@router.get("/bundle/{bundle_id}/excel")
def download_bundle_excel(bundle_id: int, db: Session = Depends(get_db)):
    bundle = db.query(Bundle).filter(Bundle.id == bundle_id).first()
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")

    data = export_bundle_excel(bundle, db)
    safe_name = bundle.name.replace(" ", "_")
    today = date.today().strftime("%Y%m%d")
    filename = f"bundle_{safe_name}_{today}.xlsx"

    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/bundle/{bundle_id}/csv")
def download_bundle_csv(bundle_id: int, db: Session = Depends(get_db)):
    bundle = db.query(Bundle).filter(Bundle.id == bundle_id).first()
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")

    data = export_bundle_csv(bundle, db)
    safe_name = bundle.name.replace(" ", "_")
    today = date.today().strftime("%Y%m%d")
    filename = f"bundle_{safe_name}_{today}.csv"

    return Response(
        content=data,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/invoices/excel")
def download_invoices_excel(
    bundle_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    include_items: bool = Query(False),
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

    invoices = q.all()
    data = export_invoices_excel(invoices, include_items=include_items)
    today = date.today().strftime("%Y%m%d")

    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="invoices_{today}.xlsx"'},
    )
