from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Identity, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base

if TYPE_CHECKING:
    from .user_model import User
    from .join_request_model import JoinRequest
    from .restaurant_waiter_model import RestaurantWaiter
    from .restaurant_responsible_model import RestaurantResponsible

class Restaurant(Base):
    __tablename__ = "restaurants"

    id: Mapped[int] = mapped_column(Identity(always=True), primary_key=True, index=True)
    restaurant_name: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    owner: Mapped["User"] = relationship("User", back_populates="restaurants")
    join_requests: Mapped[list["JoinRequest"]] = relationship(
        "JoinRequest",
        back_populates="restaurant",
        cascade="all, delete-orphan",
    )
    waiters: Mapped[list["RestaurantWaiter"]] = relationship(
        "RestaurantWaiter",
        back_populates="restaurant",
        cascade="all, delete-orphan",
    )

    responsibles: Mapped[list["RestaurantResponsible"]] = relationship(
        "RestaurantResponsible",
        back_populates="restaurant",
        cascade="all, delete-orphan",
    )