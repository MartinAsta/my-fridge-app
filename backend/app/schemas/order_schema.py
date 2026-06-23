from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict
from .user_schema import UserRead
from .dish_schema import DishRead

class OrderCreate(BaseModel):
    dish_id: int

class OrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    restaurant_id: int
    waiter_id: int
    dish_id: int
    created_at: datetime
    waiter: UserRead
    dish: DishRead