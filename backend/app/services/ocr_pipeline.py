"""
OCR pipeline: QR parsing → barcode parsing → Gemma Vision OCR → merge.
Priority: QR > OCR > barcode.
"""

from datetime import date
from decimal import Decimal
from typing import Optional
from app.services.qr_parser import parse_qr_left, parse_qr_right
from app.services.barcode_parser import parse_barcodes
from app.services import gemma_client
from app.utils.image_utils import resize_image_base64


async def run_pipeline(
    image_base64: Optional[str],
    qr_left: Optional[str],
    qr_right: Optional[str],
    barcode_raw: Optional[str],
) -> dict:
    """
    Run the full OCR pipeline and return a merged invoice data dict.
    Includes: invoice fields + items list.
    """
    # Step 1: Parse QR codes
    qr_data = {}
    qr_items = []
    if qr_left:
        qr_data = parse_qr_left(qr_left)
    if qr_right:
        qr_items = parse_qr_right(qr_right)

    # Step 2: Parse barcodes (lower priority)
    barcode_data = {}
    if barcode_raw:
        barcode_data = parse_barcodes(barcode_raw)

    # Step 3: Gemma OCR — call when image is present
    ocr_data = {}
    ocr_items = []
    if image_base64:
        try:
            # Resize to avoid huge payloads
            resized = resize_image_base64(image_base64)
            # Pass QR data as hints to guide OCR
            hint = {k: str(v) for k, v in qr_data.items() if v is not None}
            raw_ocr = await gemma_client.extract_from_image(resized, hint_json=hint or None)
            ocr_data = raw_ocr
            ocr_items = raw_ocr.get("items") or []
        except Exception:
            # OCR failure is non-fatal; continue with QR/barcode data
            pass

    # Step 4: Merge — QR takes priority, OCR fills gaps, barcode is last resort
    def _first(*values):
        for v in values:
            if v is not None and v != "":
                return v
        return None

    def _to_decimal(v):
        if v is None:
            return None
        try:
            return Decimal(str(v))
        except Exception:
            return None

    def _to_date(v):
        if v is None:
            return None
        if isinstance(v, date):
            return v
        try:
            return date.fromisoformat(str(v))
        except (ValueError, TypeError):
            return None

    merged = {
        "invoice_number": _first(qr_data.get("invoice_number"), ocr_data.get("invoice_number"), barcode_data.get("invoice_number")),
        "random_code": _first(qr_data.get("random_code"), ocr_data.get("random_code"), barcode_data.get("random_code")),
        "purchase_date": _to_date(_first(qr_data.get("purchase_date"), ocr_data.get("purchase_date"), barcode_data.get("purchase_date"))),
        # Seller name: QR doesn't have it → OCR is primary source
        "seller_name": _first(ocr_data.get("seller_name")),
        "seller_tax_id": _first(qr_data.get("seller_tax_id"), ocr_data.get("seller_tax_id"), barcode_data.get("seller_tax_id")),
        "buyer_tax_id": _first(qr_data.get("buyer_tax_id"), ocr_data.get("buyer_tax_id"), barcode_data.get("buyer_tax_id")),
        "amount_untaxed": _to_decimal(_first(qr_data.get("amount_untaxed"), ocr_data.get("amount_untaxed"), barcode_data.get("amount_untaxed"))),
        "amount_tax": _to_decimal(_first(ocr_data.get("amount_tax"))),
        "amount_total": _to_decimal(_first(qr_data.get("amount_total"), ocr_data.get("amount_total"), barcode_data.get("amount_total"))),
    }

    # Derive amount_tax if we have untaxed and total but not tax
    if merged["amount_untaxed"] and merged["amount_total"] and not merged["amount_tax"]:
        merged["amount_tax"] = merged["amount_total"] - merged["amount_untaxed"]

    # Items: QR right items preferred; fallback to OCR items
    items = qr_items if qr_items else ocr_items

    return {**merged, "items": items}
