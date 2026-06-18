from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CashChange(BaseModel):
    amount: float


class CashRegisterRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    restaurant_id: int
    register_content: float