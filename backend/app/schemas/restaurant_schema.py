from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from .cash_register_schema import CashRegisterRead

class RestaurantCreate(BaseModel):
    restaurant_name: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self


class RestaurantUpdate(BaseModel):
    restaurant_name: str | None = Field(default=None, min_length=3, max_length=50)
    password: str | None = Field(default=None, min_length=8, max_length=128)
    confirm_password: str | None = Field(default=None, min_length=8, max_length=128)

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password is not None or self.confirm_password is not None:
            if self.password != self.confirm_password:
                raise ValueError("Passwords do not match")
        return self


class RestaurantRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    restaurant_name: str
    owner_id: int
    created_at: datetime
    cash_register: CashRegisterRead