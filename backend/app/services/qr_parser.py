"""
Taiwan e-invoice QR code parser.

Left QR format (colon-separated):
  invoice_number:ROC_date:random_code:amount_untaxed:amount_total:
  buyer_tax_id:seller_tax_id:verify_code:encrypted_data[:...]

Right QR format:
  :**:item_count:encoding:item_name:qty:unit_price**item_name:qty:unit_price...
  or simply: item_name:qty:unit_price**item_name:qty:unit_price
"""

from datetime import date
from decimal import Decimal, InvalidOperation
from typing import Optional


def _roc_to_ad(roc_date_str: str) -> Optional[date]:
    """Convert ROC date string (e.g. '1130315') to a date object."""
    try:
        roc_date_str = roc_date_str.strip()
        if len(roc_date_str) == 7:
            year = int(roc_date_str[:3]) + 1911
            month = int(roc_date_str[3:5])
            day = int(roc_date_str[5:7])
            return date(year, month, day)
    except (ValueError, TypeError):
        pass
    return None


def parse_qr_left(raw: str) -> dict:
    """
    Parse the left QR code of a Taiwan e-invoice.
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

    parts = raw.strip().split(":")
    if len(parts) < 7:
        return result

    result["invoice_number"] = parts[0] or None
    result["purchase_date"] = _roc_to_ad(parts[1])
    result["random_code"] = parts[2] or None

    try:
        result["amount_untaxed"] = Decimal(parts[3])
    except InvalidOperation:
        pass

    try:
        result["amount_total"] = Decimal(parts[4])
    except InvalidOperation:
        pass

    # B2C: buyer tax id all zeros (8 digits) → treat as None
    buyer = parts[5].strip()
    if buyer and not all(c == "0" for c in buyer):
        result["buyer_tax_id"] = buyer

    result["seller_tax_id"] = parts[6] or None

    return result


def parse_qr_right(raw: str) -> list[dict]:
    """
    Parse the right QR code of a Taiwan e-invoice.
    Returns a list of item dicts: {item_name, quantity, unit_price}.
    """
    if not raw:
        return []

    items = []
    # Strip leading metadata before first '**'
    # Some formats: "**:item_count:encoding:item1:qty:price**item2:qty:price"
    content = raw.strip()

    # Split items by '**'
    parts = content.split("**")

    for part in parts:
        part = part.strip()
        if not part:
            continue
        # Each item: name:quantity:unit_price
        fields = part.split(":")
        if len(fields) < 3:
            continue
        item_name = fields[0].strip()
        if not item_name:
            continue
        try:
            quantity = Decimal(fields[1])
        except InvalidOperation:
            quantity = Decimal("1")
        try:
            unit_price = Decimal(fields[2])
        except InvalidOperation:
            unit_price = None

        items.append({
            "item_name": item_name,
            "quantity": quantity,
            "unit_price": unit_price,
            "amount": quantity * unit_price if unit_price is not None else None,
        })

    return items
