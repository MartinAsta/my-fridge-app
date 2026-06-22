from __future__ import annotations
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Identity, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base

if TYPE_CHECKING:
    from .dish_model import Dish
    from .ingredient_model import Ingredient

class DishIngredient(Base):
    __tablename__ = "dish_ingredients"

    dish_id: Mapped[int] = mapped_column(
        ForeignKey("dishes.id", ondelete="CASCADE"),
        primary_key=True,
    )
    ingredient_id: Mapped[int] = mapped_column(
        ForeignKey("ingredients.id", ondelete="CASCADE"),
        primary_key=True,
    )
    quantity_needed: Mapped[int] = mapped_column(nullable=False)

    dish: Mapped["Dish"] = relationship("Dish", back_populates="dish_ingredients")
    ingredient: Mapped["Ingredient"] = relationship("Ingredient")