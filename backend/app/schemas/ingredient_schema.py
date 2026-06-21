from pydantic import BaseModel, ConfigDict, EmailStr, Field


class IngredientCreate(BaseModel):
    name: str = Field(min_length=2, max_length=50)


class IngredientRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str