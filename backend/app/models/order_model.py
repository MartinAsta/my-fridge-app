from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Identity, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base

if TYPE_CHECKING:
    from .user_model import User
    from .dish_model import Dish
    from .restaurant_model import Restaurant


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(
        Identity(always=True),
        primary_key=True,
        index=True,
    )

    restaurant_id: Mapped[int] = mapped_column(
        ForeignKey("restaurants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    waiter_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    dish_id: Mapped[int] = mapped_column(
        ForeignKey("dishes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    restaurant: Mapped["Restaurant"] = relationship("Restaurant", back_populates="orders")
    waiter: Mapped["User"] = relationship("User")
    dish: Mapped["Dish"] = relationship("Dish")