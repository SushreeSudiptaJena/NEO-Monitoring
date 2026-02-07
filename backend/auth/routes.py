from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from db.database import get_db
from models import User, WatchedAsteroidMeta, AlertNotification
from fastapi.security import OAuth2PasswordRequestForm


from auth.utils import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])

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

class WatchCreate(BaseModel):
    neo_id: str
    name: str
    risk_score: float

    diameter_km: float | None = None
    velocity_km_s: float | None = None
    miss_distance_km: float | None = None
    close_approach_date: str | None = None
    hazardous: bool | None = None
    risk_level: str | None = None

    alert_risk_threshold: float | None = 50
    alert_window_hours: int | None = 72


class AlertSettingsUpdate(BaseModel):
    alert_risk_threshold: float
    alert_window_hours: int


@router.post("/watch")
def add_to_watchlist(
    payload: WatchCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    asteroid = WatchedAsteroid(
        neo_id=payload.neo_id,
        name=payload.name,
        risk_score=payload.risk_score,
        owner_id=user.id
    )

    db.add(asteroid)
    db.commit()
    db.refresh(asteroid)

    meta = WatchedAsteroidMeta(
        watched_id=asteroid.id,
        diameter_km=payload.diameter_km,
        velocity_km_s=payload.velocity_km_s,
        miss_distance_km=payload.miss_distance_km,
        close_approach_date=payload.close_approach_date,
        hazardous=payload.hazardous,
        risk_level=payload.risk_level,
        alert_risk_threshold=payload.alert_risk_threshold,
        alert_window_hours=payload.alert_window_hours,
    )
    db.add(meta)
    db.commit()
    return {"message": "Asteroid added to watchlist"}


@router.delete("/watch/{watch_id}")
def delete_from_watchlist(
    watch_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    asteroid = db.query(WatchedAsteroid).filter(
        WatchedAsteroid.id == watch_id,
        WatchedAsteroid.owner_id == user.id,
    ).first()

    if not asteroid:
        raise HTTPException(status_code=404, detail="Watchlist item not found")

    # Delete dependent rows first to avoid FK violations in Postgres.
    db.query(WatchedAsteroidMeta).filter(WatchedAsteroidMeta.watched_id == asteroid.id).delete(
        synchronize_session=False
    )
    db.query(AlertNotification).filter(AlertNotification.watched_id == asteroid.id).delete(
        synchronize_session=False
    )

    db.delete(asteroid)
    db.commit()
    return {"message": "Deleted"}


@router.put("/watch/{watch_id}/alert-settings")
def update_alert_settings(
    watch_id: int,
    payload: AlertSettingsUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    asteroid = db.query(WatchedAsteroid).filter(
        WatchedAsteroid.id == watch_id,
        WatchedAsteroid.owner_id == user.id,
    ).first()

    if not asteroid:
        raise HTTPException(status_code=404, detail="Watchlist item not found")

    meta = db.query(WatchedAsteroidMeta).filter(WatchedAsteroidMeta.watched_id == asteroid.id).first()
    if not meta:
        meta = WatchedAsteroidMeta(watched_id=asteroid.id)
        db.add(meta)

    meta.alert_risk_threshold = float(payload.alert_risk_threshold)
    meta.alert_window_hours = int(payload.alert_window_hours)
    db.commit()

    return {"message": "Updated"}



@router.get("/watchlist")
def get_watchlist(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items = db.query(WatchedAsteroid).filter(WatchedAsteroid.owner_id == user.id).all()
    watched_ids = [x.id for x in items]
    metas = {}
    if watched_ids:
        for m in db.query(WatchedAsteroidMeta).filter(WatchedAsteroidMeta.watched_id.in_(watched_ids)).all():
            metas[m.watched_id] = m

    out = []
    for x in items:
        m = metas.get(x.id)
        out.append(
            {
                "id": x.id,
                "neo_id": x.neo_id,
                "name": x.name,
                "risk_score": x.risk_score,
                "meta": None
                if not m
                else {
                    "diameter_km": m.diameter_km,
                    "velocity_km_s": m.velocity_km_s,
                    "miss_distance_km": m.miss_distance_km,
                    "close_approach_date": m.close_approach_date,
                    "hazardous": m.hazardous,
                    "risk_level": m.risk_level,
                    "alert_risk_threshold": m.alert_risk_threshold,
                    "alert_window_hours": m.alert_window_hours,
                },
            }
        )
    return out


@router.get("/me")
def me(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    watchlist_count = (
        db.query(WatchedAsteroid)
        .filter(WatchedAsteroid.owner_id == user.id)
        .count()
    )
    return {
        "id": user.id,
        "email": user.email,
        "watchlist_count": watchlist_count,
    }
