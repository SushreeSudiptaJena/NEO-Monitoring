from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    watchlist = relationship("WatchedAsteroid", back_populates="owner")


class WatchedAsteroid(Base):
    __tablename__ = "watched_asteroids"

    id = Column(Integer, primary_key=True)
    neo_id = Column(String)
    name = Column(String)
    risk_score = Column(Float)
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="watchlist")
