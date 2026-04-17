from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel


class InvoiceItemResponse(BaseModel):
    id: int
    item_name: str
    quantity: Decimal
    unit_price: Optional[Decimal] = None
    amount: Optional[Decimal] = None

    model_config = {"from_attributes": True}


class ClassificationSuggestion(BaseModel):
    category_id: Optional[int] = None
    category_code: Optional[str] = None
    category_name: Optional[str] = None
    source: str  # rule/llm/manual
    confidence: float = 0.0
    reasoning: Optional[str] = None


class ScanRequest(BaseModel):
    image_base64: str
    qr_left: Optional[str] = None
    qr_right: Optional[str] = None
    barcode_raw: Optional[str] = None


class InvoiceResponse(BaseModel):
    id: int
    invoice_number: Optional[str] = None
    random_code: Optional[str] = None
    purchase_date: Optional[date] = None
    seller_name: Optional[str] = None
    seller_tax_id: Optional[str] = None
    buyer_tax_id: Optional[str] = None
    amount_untaxed: Optional[Decimal] = None
    amount_tax: Optional[Decimal] = None
    amount_total: Optional[Decimal] = None
    category_id: Optional[int] = None
    classification_source: Optional[str] = None
    classification_confidence: Optional[float] = None
    classification_reasoning: Optional[str] = None
    bundle_id: Optional[int] = None
    status: str
    image_path: Optional[str] = None
    raw_qr_left: Optional[str] = None
    raw_qr_right: Optional[str] = None
    raw_barcode: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: list[InvoiceItemResponse] = []

    model_config = {"from_attributes": True}


class InvoiceUpdate(BaseModel):
    invoice_number: Optional[str] = None
    random_code: Optional[str] = None
    purchase_date: Optional[date] = None
    seller_name: Optional[str] = None
    seller_tax_id: Optional[str] = None
    buyer_tax_id: Optional[str] = None
    amount_untaxed: Optional[Decimal] = None
    amount_tax: Optional[Decimal] = None
    amount_total: Optional[Decimal] = None
    category_id: Optional[int] = None
    classification_source: Optional[str] = None
    bundle_id: Optional[int] = None
    status: Optional[str] = None
