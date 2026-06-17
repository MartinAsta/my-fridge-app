from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Identity, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base

if TYPE_CHECKING:
    from .restaurant_model import Restaurant


class CashRegister(Base):
    __tablename__ = "cash_registers"
    __table_args__ = (
        UniqueConstraint("restaurant_id", name="uq_cash_register_restaurant"),
    )

    id: Mapped[int] = mapped_column(Identity(always=True), primary_key=True, index=True)

    restaurant_id: Mapped[int] = mapped_column(
        ForeignKey("restaurants.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    register_content: Mapped[float] = mapped_column(default=0.0, nullable=False)

    restaurant: Mapped["Restaurant"] = relationship("Restaurant", back_populates="cash_register")