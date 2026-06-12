from datetime import datetime

from pydantic import BaseModel, ConfigDict


class JoinRequestCreate(BaseModel):
    restaurant_id: int


class JoinRequestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    restaurant_id: int
    user_id: int
    created_at: datetime