from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel


class BundleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None


class BundleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None


class BundleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    status: str
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    created_at: datetime
    updated_at: datetime
    invoice_count: int = 0
    total_amount: Optional[Decimal] = None

    model_config = {"from_attributes": True}
