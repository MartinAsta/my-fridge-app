from __future__ import annotations
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Identity, String, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base

if TYPE_CHECKING:
    from .restaurant_model import Restaurant
    from .dish_ingredient_model import DishIngredient

class Dish(Base):
    __tablename__ = "dishes"

    id: Mapped[int] = mapped_column(Identity(always=True),primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    
    restaurant_id: Mapped[int] = mapped_column(
        ForeignKey("restaurants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    restaurant: Mapped["Restaurant"] = relationship("Restaurant", back_populates="dishes")

    dish_ingredients: Mapped[list["DishIngredient"]] = relationship(
        "DishIngredient",
        back_populates="dish",
        cascade="all, delete-orphan",
    )