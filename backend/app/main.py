from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models.user_model import User
from .schemas.user_schema import UserCreate, UserRead
from .security import hash_password

Base.metadata.create_all(bind=engine)

app = FastAPI(title="My Fridge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/auth/register", response_model=UserRead, status_code=201)
def register_user(payload: UserCreate, db: Session = Depends(get_db)):
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    existing_email = db.execute(
        select(User).where(User.email == payload.email)
    ).scalar_one_or_none()

    if existing_email:
        raise HTTPException(status_code=409, detail="Email already registered")

    existing_username = db.execute(
        select(User).where(User.username == payload.username)
    ).scalar_one_or_none()

    if existing_username:
        raise HTTPException(status_code=409, detail="Username already taken")

    user = User(
        email=payload.email,
        username=payload.username,
        password_hash=hash_password(payload.password),
    )

    db.add(user)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="User already exists")

    db.refresh(user)
    return user