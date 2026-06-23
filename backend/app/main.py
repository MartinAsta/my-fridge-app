from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload, selectinload

from .database import Base, engine, get_db
from .models.user_model import User
from .models.restaurant_model import Restaurant
from .models.join_request_model import JoinRequest
from .models.restaurant_responsible_model import RestaurantResponsible
from .models.restaurant_waiter_model import RestaurantWaiter
from .models.cash_register_model import CashRegister
from .models.ingredient_model import Ingredient
from .models.fridge_model import Fridge
from .models.dish_ingredient_model import DishIngredient
from .models.dish_model import Dish
from .models.order_model import Order
from .schemas.user_schema import UserCreate, UserRead
from .schemas.restaurant_schema import RestaurantCreate,RestaurantRead,RestaurantUpdate
from .schemas.join_request_schema import JoinRequestCreate,JoinRequestRead
from .schemas.auth_schema import LoginRequest, Token, RestaurantLoginRequest
from .schemas.cash_register_schema import CashChange, CashRegisterRead
from .schemas.ingredient_schema import IngredientCreate, IngredientRead
from .schemas.fridge_schema import FridgeRead, FridgeCreate
from .schemas.dish_schema import DishCreate,DishIngredientCreate,DishIngredientRead,DishRead
from .schemas.order_schema import OrderCreate,OrderRead
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

def get_restaurant_or_404(db: Session, restaurant_id: int) -> Restaurant:
    restaurant = db.execute(
        select(Restaurant).where(Restaurant.id == restaurant_id)
    ).scalar_one_or_none()

    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    return restaurant

def get_target_user_or_404(db: Session, target_user_id:int) -> User:
    target_user = db.execute(
        select(User).where(User.id == target_user_id)
    ).scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    return target_user

@app.get("/waiter/restaurant/get/all", response_model=list[RestaurantRead])
def get_all_waiter_restaurants(db:Session = Depends(get_db), user:User = Depends(get_current_user)):
    restaurants = db.execute(
        select(Restaurant)
        .join(RestaurantWaiter, RestaurantWaiter.restaurant_id == Restaurant.id)
        .where(user.id == RestaurantWaiter.user_id)
    ).scalars().all()
    return restaurants

@app.get("/responsible/restaurant/get/all", response_model=list[RestaurantRead])
def get_all_responsible_restaurants(db:Session = Depends(get_db), user:User = Depends(get_current_user)):
    restaurants = db.execute(
        select(Restaurant)
        .join(RestaurantResponsible, RestaurantResponsible.restaurant_id == Restaurant.id)
        .where(user.id == RestaurantResponsible.user_id)
    ).scalars().all()
    return restaurants

@app.get("/pending/restaurants/get", response_model=list[RestaurantRead])
def get_all_pending_restaurants(db:Session = Depends(get_db), user:User = Depends(get_current_user)):
    restaurants = db.execute(
        select(Restaurant)
        .join(JoinRequest, JoinRequest.restaurant_id == Restaurant.id)
        .where(JoinRequest.user_id == user.id)
    ).scalars().all()
    return restaurants

@app.post("/waiter/add/{restaurant_id}/{user_id}", status_code=201)
def add_waiter_to_restaurant(restaurant_id:int, 
                             user_id:int, 
                             db:Session = Depends(get_db), 
                             user:User = Depends(get_current_user)):
    restaurant = get_restaurant_or_404(db, restaurant_id)

    if restaurant.owner_id != user.id:
        raise HTTPException(status_code=403, detail="You do not own this restaurant")
    
    target_user = get_target_user_or_404(db, user_id)
    already_exists = db.execute(
        select(RestaurantWaiter).where(RestaurantWaiter.restaurant_id == restaurant_id,
                                       RestaurantWaiter.user_id == user_id)
    ).scalar_one_or_none()
    if already_exists:
        raise HTTPException(status_code=409, detail="User already works here")
    join_request = db.execute(
        select(JoinRequest).where(JoinRequest.user_id == user_id,
                                  JoinRequest.restaurant_id == restaurant_id)
    ).scalar_one_or_none()
    if not join_request:
        raise HTTPException(status_code=404, detail="Join request not found")
    
    waiter = RestaurantWaiter(
        restaurant_id = restaurant_id,
        user_id = user_id
    )

    db.add(waiter)
    db.delete(join_request)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Could not add waiter")

    db.refresh(waiter)
    return waiter

@app.post("/responsible/add/{restaurant_id}/{user_id}", status_code=201)
def add_responsible_to_restaurant(restaurant_id:int, 
                             user_id:int, 
                             db:Session = Depends(get_db), 
                             user:User = Depends(get_current_user)):
    restaurant = get_restaurant_or_404(db, restaurant_id)

    if restaurant.owner_id != user.id:
        raise HTTPException(status_code=403, detail="You do not own this restaurant")
    
    target_user = get_target_user_or_404(db, user_id)
    already_exists = db.execute(
        select(RestaurantResponsible).where(RestaurantResponsible.restaurant_id == restaurant_id,
                                       RestaurantResponsible.user_id == user_id)
    ).scalar_one_or_none()
    if already_exists:
        raise HTTPException(status_code=409, detail="User already works here")
    join_request = db.execute(
        select(JoinRequest).where(JoinRequest.user_id == user_id,
                                  JoinRequest.restaurant_id == restaurant_id)
    ).scalar_one_or_none()

    if not join_request:
        raise HTTPException(status_code=404, detail="Join request not found")
    
    responsible = RestaurantResponsible(
        restaurant_id = restaurant_id,
        user_id = user_id
    )

    db.add(responsible)
    db.delete(join_request)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Could not add responsible")

    db.refresh(responsible)
    return responsible

@app.delete("/deny/restaurantaccess/{restaurant_id}/{user_id}", status_code=204)
def deny_restaurant_access(restaurant_id:int, 
                           user_id:int, 
                           db:Session = Depends(get_db),
                           user: User = Depends(get_current_user)):
    restaurant = get_restaurant_or_404(db, restaurant_id)
    if restaurant.owner_id != user.id:
        raise HTTPException(status_code=403, detail="You do not own this restaurant")
    target_user = get_target_user_or_404(db, user_id)

    join_request = db.execute(
        select(JoinRequest).where(JoinRequest.user_id == user_id,
                                  JoinRequest.restaurant_id == restaurant_id)
    ).scalar_one_or_none()

    if not join_request:
        raise HTTPException(status_code=404, detail="Join request not found")
    
    db.delete(join_request)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Join request couldn't be deleted")

@app.delete("/delete/waiter/{restaurant_id}/{user_id}", status_code=204)
def remove_waiter_from_restaurant(restaurant_id:int,
                                  user_id:int,
                                  db:Session = Depends(get_db),
                                  user:User = Depends(get_current_user)):
    restaurant = get_restaurant_or_404(db, restaurant_id)
    if restaurant.owner_id != user.id:
        raise HTTPException(status_code=403, detail="You do not own this restaurant")
    target_user = get_target_user_or_404(db, user_id)
    waiter = db.execute(
        select(RestaurantWaiter).where(RestaurantWaiter.user_id == user_id,
                                       RestaurantWaiter.restaurant_id == restaurant_id)
    ).scalar_one_or_none()
    if not waiter:
        raise HTTPException(status_code=404, detail="Waiter not found")
    
    db.delete(waiter)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Waiter couldn't be deleted")

@app.delete("/delete/responsible/{restaurant_id}/{user_id}", status_code=204)
def remove_responsible_from_restaurant(restaurant_id:int,
                                  user_id:int,
                                  db:Session = Depends(get_db),
                                  user:User = Depends(get_current_user)):
    restaurant = get_restaurant_or_404(db, restaurant_id)
    if restaurant.owner_id != user.id:
        raise HTTPException(status_code=403, detail="You do not own this restaurant")
    target_user = get_target_user_or_404(db, user_id)
    responsible = db.execute(
        select(RestaurantResponsible).where(RestaurantResponsible.user_id == user_id,
                                            RestaurantResponsible.restaurant_id == restaurant_id)
    ).scalar_one_or_none()
    if not responsible:
        raise HTTPException(status_code=404, detail="Responsible not found")
    
    db.delete(responsible)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Responsible couldn't be deleted")

@app.get("/restaurant/get/all",response_model=list[RestaurantRead])
def get_all_restaurants(db:Session = Depends(get_db), user:User = Depends(get_current_user)):
    restaurants = db.execute(
        select(Restaurant).where(Restaurant.owner_id != user.id)
    ).scalars().all()
    return restaurants

@app.get("/restaurant/get/{restaurant_id}", response_model=RestaurantRead)
def get_restaurant(restaurant_id:int, db:Session = Depends(get_db), user:User = Depends(get_current_user)):
    restaurant = get_restaurant_or_404(db, restaurant_id)

    if restaurant.owner_id != user.id:
        raise HTTPException(status_code=403, detail="You do not own this restaurant")

    return restaurant

@app.get("/restaurant/user/get/{restaurant_id}", response_model=RestaurantRead)
def get_restaurant_for_user(restaurant_id:int, db:Session = Depends(get_db)):
    restaurant = get_restaurant_or_404(db, restaurant_id)

    return restaurant

@app.get("/restaurant/pending/{restaurant_id}", response_model=list[UserRead])
def get_pending_list(restaurant_id:int, db:Session = Depends(get_db), user:User = Depends(get_current_user)):
    restaurant = get_restaurant_or_404(db, restaurant_id)

    if restaurant.owner_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="You do not own this restaurant",
        )
    pending_list = db.execute(
        select(User)
        .join(JoinRequest, JoinRequest.user_id == User.id)
        .where(JoinRequest.restaurant_id == restaurant_id)
    ).scalars().all()
    return pending_list

@app.get("/get/waiters/{restaurant_id}", response_model=list[UserRead])
def get_waiters_list(restaurant_id:int, db:Session = Depends(get_db), user:User = Depends(get_current_user)):
    restaurant = get_restaurant_or_404(db, restaurant_id)
    if restaurant.owner_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="You do not own this restaurant",
        )
    waiters_list = db.execute(
        select(User)
        .join(RestaurantWaiter, RestaurantWaiter.user_id == User.id)
        .where(RestaurantWaiter.restaurant_id == restaurant_id)
    ).scalars().all()
    return waiters_list

@app.get("/get/responsibles/{restaurant_id}", response_model=list[UserRead])
def get_responsibles_list(restaurant_id:int, db:Session = Depends(get_db), user:User = Depends(get_current_user)):
    restaurant = get_restaurant_or_404(db, restaurant_id)
    if restaurant.owner_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="You do not own this restaurant",
        )
    responsibles_list = db.execute(
        select(User)
        .join(RestaurantResponsible, RestaurantResponsible.user_id == User.id)
        .where(RestaurantResponsible.restaurant_id == restaurant_id)
    ).scalars().all()
    return responsibles_list

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
    db.flush()

    cash_register = CashRegister(
        restaurant_id=restaurant.id,
        register_content=0.0,
    )
    db.add(cash_register)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Restaurant already exists")

    db.refresh(restaurant)
    return restaurant

@app.delete("/restaurant/delete/{restaurant_id}", status_code=204)
def delete_restaurant(restaurant_id:int, db:Session = Depends(get_db), user = Depends(get_current_user)):
    restaurant = get_restaurant_or_404(db, restaurant_id)

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

@app.post("/restaurant/login/{restaurant_id}")
def login_restaurant(restaurant_id:int,
                     payload:RestaurantLoginRequest, 
                     db:Session = Depends(get_db), 
                     user:User = Depends(get_current_user)):
    restaurant = get_restaurant_or_404(db, restaurant_id)

    if restaurant.owner_id == user.id:
        raise HTTPException(status_code=400, detail="You already own this restaurant")
    if not verify_password(payload.password, restaurant.password_hash):
        raise HTTPException(status_code=401, detail="Invalid restaurant password")
    existing_request = db.execute(
        select(JoinRequest).where(
            JoinRequest.restaurant_id == restaurant_id,
            JoinRequest.user_id == user.id
        )
    ).scalar_one_or_none()

    if existing_request:
        raise HTTPException(status_code=409, detail="You already applied to this restaurant")
    
    join_request = JoinRequest(
        restaurant_id = restaurant_id,
        user_id = user.id
    )
    db.add(join_request)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Error to create JoinRequest")

    db.refresh(join_request)
    return join_request

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

@app.post("/cash/add/{restaurant_id}", response_model=CashRegisterRead)
def add_or_remove_money_from_cash_register(restaurant_id:int,
                                           payload:CashChange,
                                           db:Session = Depends(get_db),
                                           user:User = Depends(get_current_user)):
    restaurant = get_restaurant_or_404(db, restaurant_id)
    is_owner = restaurant.owner_id == user.id
    responsible = db.execute(
        select(RestaurantResponsible)
        .where(RestaurantResponsible.user_id == user.id,
               RestaurantResponsible.restaurant_id == restaurant_id)
    ).scalar_one_or_none()
    if not is_owner and not responsible:
        raise HTTPException(status_code=403, detail="You do not have the right to change this cash register")
    cash_register = db.execute(
        select(CashRegister)
        .where(CashRegister.restaurant_id == restaurant_id)
    ).scalar_one_or_none()
    if not cash_register:
        raise HTTPException(status_code=404, detail="Cash register not found")
    
    cash_register.register_content += payload.amount
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Couldn't modify the cash register")

    db.refresh(cash_register)
    return cash_register

@app.get("/cash/get/{restaurant_id}", response_model=CashRegisterRead)
def get_restaurant_cash_register_content(restaurant_id:int,
                                         db:Session = Depends(get_db),
                                         user:User = Depends(get_current_user)):
    restaurant = get_restaurant_or_404(db, restaurant_id)
    is_owner = restaurant.owner_id == user.id
    responsible = db.execute(
        select(RestaurantResponsible)
        .where(RestaurantResponsible.user_id == user.id,
               RestaurantResponsible.restaurant_id == restaurant_id)
    ).scalar_one_or_none()
    if not is_owner and not responsible:
        raise HTTPException(status_code=403, detail="You do not have the right to see the content of the cash register")
    cash_register = db.execute(
        select(CashRegister)
        .where(CashRegister.restaurant_id == restaurant_id)
    ).scalar_one_or_none()
    return cash_register

@app.post("/add/ingredient", response_model=IngredientRead, status_code=201)
def add_ingredient(payload:IngredientCreate, db:Session = Depends(get_db)):
    already_exists = db.execute(
        select(Ingredient).where(Ingredient.name == payload.name)
    ).scalar_one_or_none()
    if already_exists:
        raise HTTPException(status_code=409, detail="This ingredient already exists")
    ingredient = Ingredient(
        name = payload.name
    )

    db.add(ingredient)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Ingredient already exists")

    db.refresh(ingredient)
    return ingredient

@app.get("/get/fridge/{restaurant_id}", response_model=list[FridgeRead])
def get_fridge(restaurant_id: int,
               db: Session = Depends(get_db),
               user: User = Depends(get_current_user),
):
    restaurant = get_restaurant_or_404(db, restaurant_id)

    is_owner = restaurant.owner_id == user.id
    is_responsible = db.execute(
        select(RestaurantResponsible).where(
            RestaurantResponsible.restaurant_id == restaurant_id,
            RestaurantResponsible.user_id == user.id,
        )
    ).scalar_one_or_none()

    if not is_owner and not is_responsible:
        raise HTTPException(status_code=403, detail="You do not have access to this fridge")

    fridge_items = db.execute(
        select(Fridge)
        .options(selectinload(Fridge.ingredient))
        .where(Fridge.restaurant_id == restaurant_id)
    ).scalars().all()

    return fridge_items

@app.post("/add/fridge/{restaurant_id}", response_model=list[FridgeRead])
def add_ingredients_to_fridge(
    restaurant_id: int,
    payload: list[FridgeCreate],
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    restaurant = get_restaurant_or_404(db, restaurant_id)

    is_owner = restaurant.owner_id == user.id
    is_responsible = db.execute(
        select(RestaurantResponsible).where(
            RestaurantResponsible.restaurant_id == restaurant_id,
            RestaurantResponsible.user_id == user.id,
        )
    ).scalar_one_or_none()

    if not is_owner and not is_responsible:
        raise HTTPException(status_code=403, detail="You do not have access to this fridge")

    if not payload:
        raise HTTPException(status_code=400, detail="No ingredients provided")

    quantities_by_ingredient: dict[int, int] = {}
    for item in payload:
        quantities_by_ingredient[item.ingredient_id] = quantities_by_ingredient.get(item.ingredient_id, 0) + item.quantity

    ingredient_ids = set(quantities_by_ingredient.keys())

    existing_ingredient_ids = set(
        db.execute(
            select(Ingredient.id).where(Ingredient.id.in_(ingredient_ids))
        ).scalars().all()
    )

    missing = ingredient_ids - existing_ingredient_ids
    if missing:
        raise HTTPException(
            status_code=404,
            detail=f"Ingredient(s) not found: {', '.join(map(str, sorted(missing)))}",
        )

    existing_fridge_items = db.execute(
        select(Fridge).where(
            Fridge.restaurant_id == restaurant_id,
            Fridge.ingredient_id.in_(ingredient_ids),
        )
    ).scalars().all()

    fridge_by_ingredient = {item.ingredient_id: item for item in existing_fridge_items}

    for ingredient_id, quantity in quantities_by_ingredient.items():
        if ingredient_id in fridge_by_ingredient:
            fridge_by_ingredient[ingredient_id].quantity += quantity
        else:
            db.add(
                Fridge(
                    restaurant_id=restaurant_id,
                    ingredient_id=ingredient_id,
                    quantity=quantity,
                )
            )

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Could not update fridge")

    updated_items = db.execute(
        select(Fridge)
        .options(joinedload(Fridge.ingredient))
        .where(
            Fridge.restaurant_id == restaurant_id,
            Fridge.ingredient_id.in_(ingredient_ids),
        )
    ).scalars().all()

    return updated_items

@app.get("/ingredients", response_model=list[IngredientRead])
def get_all_ingredients(db: Session = Depends(get_db)):
    ingredients = db.execute(
        select(Ingredient).order_by(Ingredient.name)
    ).scalars().all()

    return ingredients

@app.post("/add/dish/{restaurant_id}", response_model=DishRead)
def add_dish(
    restaurant_id: int,
    payload: DishCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    restaurant = get_restaurant_or_404(db, restaurant_id)

    is_owner = restaurant.owner_id == user.id
    is_responsible = db.execute(
        select(RestaurantResponsible).where(
            RestaurantResponsible.restaurant_id == restaurant_id,
            RestaurantResponsible.user_id == user.id,
        )
    ).scalar_one_or_none()

    if not is_owner and not is_responsible:
        raise HTTPException(status_code=403, detail="You do not have access to this restaurant")

    if not payload.ingredients:
        raise HTTPException(status_code=400, detail="A dish must contain at least one ingredient")

    quantities_by_ingredient: dict[int, int] = {}
    for item in payload.ingredients:
        quantities_by_ingredient[item.ingredient_id] = quantities_by_ingredient.get(item.ingredient_id, 0) + item.quantity_needed

    ingredient_ids = set(quantities_by_ingredient.keys())

    existing_ingredient_ids = set(
        db.execute(
            select(Ingredient.id).where(Ingredient.id.in_(ingredient_ids))
        ).scalars().all()
    )

    missing = ingredient_ids - existing_ingredient_ids
    if missing:
        raise HTTPException(
            status_code=404,
            detail=f"Ingredient(s) not found: {', '.join(map(str, sorted(missing)))}",
        )

    dish = Dish(
        restaurant_id=restaurant_id,
        name=payload.name,
        price=payload.price,
    )
    db.add(dish)
    db.flush()

    for ingredient_id, quantity_needed in quantities_by_ingredient.items():
        db.add(
            DishIngredient(
                dish_id=dish.id,
                ingredient_id=ingredient_id,
                quantity_needed=quantity_needed,
            )
        )

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Could not create dish")

    dish = db.execute(
        select(Dish)
        .options(selectinload(Dish.dish_ingredients))
        .where(Dish.id == dish.id)
    ).scalar_one()

    return dish

@app.get("/get/menu/{restaurant_id}", response_model=list[DishRead])
def get_menu(restaurant_id:int,
                   db:Session = Depends(get_db),
                   user:User = Depends(get_current_user)):
    restaurant = get_restaurant_or_404(db, restaurant_id)
    is_owner = restaurant.owner_id == user.id
    is_responsible = db.execute(
        select(RestaurantResponsible).where(
            RestaurantResponsible.restaurant_id == restaurant_id,
            RestaurantResponsible.user_id == user.id
        )
    ).scalar_one_or_none()
    is_waiter = db.execute(
        select(RestaurantWaiter).where(
            RestaurantWaiter.user_id == user.id,
            RestaurantWaiter.restaurant_id == restaurant_id
        )
    ).scalar_one_or_none()
    if not is_owner and not is_responsible and not is_waiter:
        raise HTTPException(status_code=403, detail="You do not have access to this menu")
    
    menu = db.execute(select(Dish)
                      .options(selectinload(Dish.dish_ingredients)
                               .selectinload(DishIngredient.ingredient))
                               .where(Dish.restaurant_id == restaurant_id)).scalars().all()

    return menu

@app.post("/create/order/{restaurant_id}", response_model=OrderRead)
def create_order(restaurant_id:int,
                 payload:OrderCreate,
                 db:Session = Depends(get_db),
                 user:User = Depends(get_current_user)):
    
    restaurant = get_restaurant_or_404(db,restaurant_id)
    is_waiter = db.execute(
        select(RestaurantWaiter).where(
            RestaurantWaiter.user_id == user.id,
            RestaurantWaiter.restaurant_id == restaurant_id
        )
    ).scalar_one_or_none()
    if not is_waiter:
        raise HTTPException(status_code=403, detail="You do not have the right to place orders")
    cash_register = db.execute(
        select(CashRegister).where(CashRegister.restaurant_id == restaurant_id)
    ).scalar_one_or_none()
    dish = db.execute(
        select(Dish)
        .where(Dish.id == payload.dish_id,
               Dish.restaurant_id == restaurant_id)
    ).scalar_one_or_none()
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found")
    new_order = Order(
        restaurant_id = restaurant_id,
        waiter_id = user.id,
        dish_id = payload.dish_id
    )
    db.add(new_order)
    
    try:
        cash_register.register_content += dish.price
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Could not create order")
    db.refresh(new_order)
    return new_order

@app.get("/get/orders/{restaurant_id}", response_model=list[OrderRead])
def get_orders_logs(restaurant_id:int,
                    db:Session = Depends(get_db),
                    user:User = Depends(get_current_user)):
    restaurant = get_restaurant_or_404(db, restaurant_id)
    is_owner = restaurant.owner_id == user.id
    if not is_owner:
        raise HTTPException(status_code=403, detail="You do not have the right to see the logs")
    orders = db.execute(
        select(Order)
        .options(selectinload(Order.waiter),
                 selectinload(Order.dish))
        .where(Order.restaurant_id == restaurant_id)
    ).scalars().all()
    return orders