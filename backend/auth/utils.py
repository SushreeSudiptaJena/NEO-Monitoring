from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt
import hashlib

SECRET_KEY = "supersecret1"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _normalize_password_for_bcrypt(password: str) -> str:
    # bcrypt only uses the first 72 bytes of the password and passlib/bcrypt
    # will raise if longer. Normalize long passwords deterministically.
    password_bytes = password.encode("utf-8")
    if len(password_bytes) <= 72:
        return password
    return hashlib.sha256(password_bytes).hexdigest()

def hash_password(password: str):
    return pwd_context.hash(_normalize_password_for_bcrypt(password))

def verify_password(plain, hashed):
    return pwd_context.verify(_normalize_password_for_bcrypt(plain), hashed)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
