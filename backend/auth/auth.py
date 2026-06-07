import os
from datetime import datetime, timedelta, timezone
from typing import Optional, TYPE_CHECKING

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from db import getDb

if TYPE_CHECKING:
    from db import models

secretKey = os.getenv("SECRET_KEY", "dev-secret-change-in-production-please")
algorithm = "HS256"
accessTokenExpireMinutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

pwdContext = CryptContext(schemes=["sha256_crypt"], deprecated="auto")
bearerScheme = HTTPBearer()


def hashPassword(password: str) -> str:
    return pwdContext.hash(password)


def verifyPassword(plain: str, hashed: str) -> bool:
    return pwdContext.verify(plain, hashed)


def createAccessToken(data: dict, expiresDelta: Optional[timedelta] = None) -> str:
    toEncode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expiresDelta or timedelta(minutes=accessTokenExpireMinutes)
    )
    toEncode["exp"] = expire
    return jwt.encode(toEncode, secretKey, algorithm=algorithm)


def getCurrentUser(
    credentials: HTTPAuthorizationCredentials = Depends(bearerScheme),
    db: Session = Depends(getDb),
) -> "models.User":
    from db import models
    
    credentialsException = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, secretKey, algorithms=[algorithm])
        userId: str = payload.get("sub")
        if userId is None:
            raise credentialsException
    except JWTError:
        raise credentialsException

    user = db.query(models.User).filter(models.User.id == int(userId)).first()
    if user is None:
        raise credentialsException
    return user


def requireAdmin(currentUser: "models.User" = Depends(getCurrentUser)) -> "models.User":
    if currentUser.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return currentUser
