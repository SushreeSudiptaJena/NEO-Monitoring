from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal

from models import User
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import Depends, HTTPException
from auth.utils import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register")
def register(email: str, password: str, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="User already exists")

    user = User(
        email=email,
        hashed_password=hash_password(password)
    )
    db.add(user)
    db.commit()
    return {"message": "User registered successfully"}



@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    email = form_data.username
    password = form_data.password

    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": user.email})
    return {
        "access_token": token,
        "token_type": "bearer"
    }


from auth.dependencies import get_current_user
from models import WatchedAsteroid
from database import SessionLocal

@router.post("/watch")
def add_to_watchlist(
    neo_id: str,
    name: str,
    risk_score: float,
    user = Depends(get_current_user)
):
    db = SessionLocal()

    asteroid = WatchedAsteroid(
        neo_id=neo_id,
        name=name,
        risk_score=risk_score,
        owner_id=user.id
    )

    db.add(asteroid)
    db.commit()
    return {"message": "Asteroid added to watchlist"}



@router.get("/watchlist")
def get_watchlist(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(WatchedAsteroid).filter(
        WatchedAsteroid.owner_id == user.id
    ).all()
