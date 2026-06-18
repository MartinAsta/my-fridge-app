from sqlalchemy import Identity, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base

class Ingredient(Base):
    __tablename__ = "ingredients"

    id: Mapped[int] = mapped_column(Identity(always=True),primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)