from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Identity, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base

if TYPE_CHECKING:
    from .user_model import User
    from .restaurant_model import Restaurant


class RestaurantResponsible(Base):
    __tablename__ = "restaurant_responsibles"
    __table_args__ = (
        UniqueConstraint("restaurant_id", "user_id", name="uq_restaurant_responsibles_restaurant_user"),
    )

    id: Mapped[int] = mapped_column(Identity(always=True), primary_key=True, index=True)

    restaurant_id: Mapped[int] = mapped_column(
        ForeignKey("restaurants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    restaurant: Mapped["Restaurant"] = relationship("Restaurant", back_populates="restaurant_responsibles")
    user: Mapped["User"] = relationship("User", back_populates="restaurant_responsibles")