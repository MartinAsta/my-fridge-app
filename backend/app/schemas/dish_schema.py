from __future__ import annotations
from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict, Field

if TYPE_CHECKING:
    from .ingredient_schema import IngredientRead


class DishIngredientCreate(BaseModel):
    ingredient_id: int
    quantity_needed: int = Field(gt=0)


class DishIngredientRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ingredient_id: int
    quantity_needed: int
    ingredient: IngredientRead


class DishCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    price: float = Field(gt=0)
    ingredients: list[DishIngredientCreate]


class DishRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    restaurant_id: int
    name: str
    price: float
    dish_ingredients: list[DishIngredientRead]