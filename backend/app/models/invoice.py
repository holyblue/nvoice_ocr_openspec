from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import String, Integer, DateTime, Date, Numeric, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Invoice identification
    invoice_number: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    random_code: Mapped[str | None] = mapped_column(String(10), nullable=True)

    # Dates
    purchase_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Seller info
    seller_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    seller_tax_id: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)

    # Buyer info
    buyer_tax_id: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Amounts
    amount_untaxed: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    amount_tax: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    amount_total: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)

    # Classification
    category_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )
    classification_source: Mapped[str | None] = mapped_column(String(20), nullable=True)  # rule/llm/manual
    classification_confidence: Mapped[float | None] = mapped_column(Numeric(5, 4), nullable=True)
    classification_reasoning: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Bundle
    bundle_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("bundles.id", ondelete="SET NULL"), nullable=True
    )

    # Status
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending/confirmed/rejected

    # Image
    image_path: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Raw scan data
    raw_qr_left: Mapped[str | None] = mapped_column(Text, nullable=True)
    raw_qr_right: Mapped[str | None] = mapped_column(Text, nullable=True)
    raw_barcode: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    category: Mapped["Category | None"] = relationship("Category", back_populates="invoices")  # noqa: F821
    bundle: Mapped["Bundle | None"] = relationship("Bundle", back_populates="invoices")  # noqa: F821
    items: Mapped[list["InvoiceItem"]] = relationship(
        "InvoiceItem", back_populates="invoice", cascade="all, delete-orphan"
    )


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    invoice_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False
    )
    item_name: Mapped[str] = mapped_column(String(200), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(10, 3), default=1)
    unit_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)

    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="items")
