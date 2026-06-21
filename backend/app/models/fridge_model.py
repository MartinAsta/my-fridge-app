from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Identity, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base

if TYPE_CHECKING:
    from .restaurant_model import Restaurant
    from .ingredient_model import Ingredient


class Fridge(Base):
    __tablename__ = "fridges"
    __table_args__ = (
        UniqueConstraint("restaurant_id", "ingredient_id", name="uq_fridge_restaurant_ingredient"),
    )

    id: Mapped[int] = mapped_column(Identity(always=True), primary_key=True, index=True)

    restaurant_id: Mapped[int] = mapped_column(
        ForeignKey("restaurants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    ingredient_id: Mapped[int] = mapped_column(
        ForeignKey("ingredients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    quantity: Mapped[int] = mapped_column(nullable=False, default=0)

    restaurant: Mapped["Restaurant"] = relationship("Restaurant", back_populates="fridge_items")
    ingredient: Mapped["Ingredient"] = relationship("Ingredient", back_populates="fridge_items")