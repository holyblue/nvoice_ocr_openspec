from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    account_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    rules: Mapped[list["CategoryRule"]] = relationship(
        "CategoryRule", back_populates="category", cascade="all, delete-orphan"
    )
    invoices: Mapped[list] = relationship("Invoice", back_populates="category")


class CategoryRule(Base):
    __tablename__ = "category_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    category_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False
    )
    rule_type: Mapped[str] = mapped_column(String(50), nullable=False)
    rule_value: Mapped[str] = mapped_column(String(255), nullable=False)
    priority: Mapped[int] = mapped_column(Integer, default=10)

    category: Mapped["Category"] = relationship("Category", back_populates="rules")
