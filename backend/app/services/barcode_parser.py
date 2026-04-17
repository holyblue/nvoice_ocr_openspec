"""
Taiwan paper invoice barcode parser (Code39 three-barcode format).

Barcode 1 (28 chars): invoice number prefix + year/month + random code
Barcode 2 (24 chars): amount info
Barcode 3 (varies): buyer/seller tax ids

Raw format passed as a single string with barcodes separated by spaces or newlines.
"""

from datetime import date
from decimal import Decimal, InvalidOperation
from typing import Optional


def parse_barcodes(raw: str) -> dict:
    """
    Parse the three Code39 barcodes from a Taiwan paper invoice.
    Returns a dict with parsed fields; missing fields are None.
    """
    result: dict = {
        "invoice_number": None,
        "purchase_date": None,
        "random_code": None,
        "amount_untaxed": None,
        "amount_total": None,
        "buyer_tax_id": None,
        "seller_tax_id": None,
    }

    if not raw:
        return result

    # Barcodes may be separated by spaces or newlines
    parts = [p.strip() for p in raw.replace("\n", " ").split() if p.strip()]
    if len(parts) < 1:
        return result

    # Barcode 1: invoice number (10 chars) + year-month (5 chars, YYMM format) + random (4)
    b1 = parts[0] if len(parts) > 0 else ""
    if len(b1) >= 19:
        inv_num = b1[0:10]
        result["invoice_number"] = inv_num

        # Year-month: digits 11-15 e.g. "11305" = ROC year 113, month 05
        ym = b1[10:15]
        try:
            roc_year = int(ym[:3])
            month = int(ym[3:5])
            year = roc_year + 1911
            result["purchase_date"] = date(year, month, 1)
        except (ValueError, TypeError):
            pass

        if len(b1) >= 23:
            result["random_code"] = b1[19:23]

    # Barcode 2: amounts
    b2 = parts[1] if len(parts) > 1 else ""
    if len(b2) >= 16:
        try:
            result["amount_untaxed"] = Decimal(str(int(b2[0:8])))
        except (InvalidOperation, ValueError):
            pass
        try:
            result["amount_total"] = Decimal(str(int(b2[8:16])))
        except (InvalidOperation, ValueError):
            pass

    # Barcode 3: buyer + seller tax ids
    b3 = parts[2] if len(parts) > 2 else ""
    if len(b3) >= 16:
        buyer = b3[0:8]
        seller = b3[8:16]
        if buyer and buyer != "00000000":
            result["buyer_tax_id"] = buyer
        result["seller_tax_id"] = seller or None

    return result
