from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey
from sqlalchemy.orm import relationship
from db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    watchlist = relationship("WatchedAsteroid", back_populates="owner", cascade="all, delete-orphan")


class WatchedAsteroid(Base):
    __tablename__ = "watched_asteroids"

    id = Column(Integer, primary_key=True)
    neo_id = Column(String)
    name = Column(String)
    risk_score = Column(Float)
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="watchlist")
    meta = relationship("WatchedAsteroidMeta", uselist=False, back_populates="watched", cascade="all, delete-orphan")
    alerts = relationship("AlertNotification", back_populates="watched", cascade="all, delete-orphan")


class WatchedAsteroidMeta(Base):
    __tablename__ = "watched_asteroid_meta"

    id = Column(Integer, primary_key=True)
    watched_id = Column(Integer, ForeignKey("watched_asteroids.id", ondelete="CASCADE"), unique=True, index=True)

    watched = relationship("WatchedAsteroid", back_populates="meta")

    diameter_km = Column(Float)
    velocity_km_s = Column(Float)
    miss_distance_km = Column(Float)
    close_approach_date = Column(String)
    hazardous = Column(Boolean)
    risk_level = Column(String)

    alert_risk_threshold = Column(Float, default=50)
    alert_window_hours = Column(Integer, default=72)


class AlertNotification(Base):
    __tablename__ = "alert_notifications"

    id = Column(Integer, primary_key=True)
    owner_id = Column(Integer, ForeignKey("users.id"), index=True)
    watched_id = Column(Integer, ForeignKey("watched_asteroids.id", ondelete="CASCADE"), index=True)

    watched = relationship("WatchedAsteroid", back_populates="alerts")

    message = Column(String)
    created_at = Column(String)
    is_read = Column(Boolean, default=False)
