from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models.user_model import User
from .models.restaurant_model import Restaurant
from .schemas.user_schema import UserCreate, UserRead
from .schemas.restaurant_schema import RestaurantCreate,RestaurantRead,RestaurantUpdate
from .schemas.auth_schema import LoginRequest, Token
from .security import hash_password, verify_password, create_access_token, decode_access_token

Base.metadata.create_all(bind=engine)

app = FastAPI(title="MyRestaurant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_access_token(token)
    username = payload.get("sub")

    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.execute(
        select(User).where(User.username == username)
    ).scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user

@app.get("/restaurant/get/{restaurant_id}", response_model=RestaurantRead)
def get_restaurant(restaurant_id:int, db:Session = Depends(get_db), user:User = Depends(get_current_user)):
    restaurant = db.execute(
        select(Restaurant).where(Restaurant.id == restaurant_id)
    ).scalar_one_or_none()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    if restaurant.owner_id != user.id:
        raise HTTPException(status_code=403, detail="You do not own this restaurant")

    return restaurant

@app.get("/restaurant/get/all",response_model=list[RestaurantRead])
def get_all_restaurants(db:Session = Depends(get_db), user:User = Depends(get_current_user)):
    restaurants = db.execute(
        select(Restaurant).where(Restaurant.owner_id != user.id)
    ).scalars().all()
    return restaurants

@app.post("/restaurant/create", response_model=RestaurantRead, status_code=201)
def create_restaurant(
    payload: RestaurantCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing_restaurant = db.execute(
        select(Restaurant).where(Restaurant.restaurant_name == payload.restaurant_name)
    ).scalar_one_or_none()

    if existing_restaurant:
        raise HTTPException(status_code=409, detail="This restaurant already exists")

    restaurant = Restaurant(
        restaurant_name=payload.restaurant_name,
        password_hash=hash_password(payload.password),
        owner_id=current_user.id,
    )

    db.add(restaurant)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Restaurant already exists")

    db.refresh(restaurant)
    return restaurant

@app.delete("/restaurant/delete/{restaurant_id}", status_code=204)
def delete_restaurant(restaurant_id:int, db:Session = Depends(get_db), user = Depends(get_current_user)):
    restaurant = db.execute(
        select(Restaurant).where(Restaurant.id == restaurant_id)
    ).scalar_one_or_none()

    if not restaurant:
        raise HTTPException(
            status_code=404,
            detail="Restaurant not found",
        )

    if restaurant.owner_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="You do not own this restaurant",
        )
    
    db.delete(restaurant)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Restaurant couldn't be deleted")


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

@app.post("/auth/login", response_model=Token)
def login_user(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.execute(
        select(User).where(User.email == payload.email)
    ).scalar_one_or_none()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token({"sub": user.username})
    return Token(access_token=access_token, token_type="bearer")

@app.get("/users/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

@app.get("/users/me/restaurants", response_model=list[RestaurantRead])
def get_user_restaurants(current_user:User = Depends(get_current_user)):
    return current_user.restaurants