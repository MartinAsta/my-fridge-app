from pydantic import BaseModel, ConfigDict, Field
from .ingredient_schema import IngredientRead

class FridgeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    restaurant_id: int
    ingredient_id: int
    quantity: int
    ingredient: IngredientRead

class FridgeCreate(BaseModel):
    ingredient_id: int
    quantity: int = Field(gt=0)