import os

from sqlalchemy.orm import Session

from .. import models
import schemas
from auth import hashPassword


def getUserByUsername(db: Session, username: str) -> models.User | None:
    return db.query(models.User).filter(models.User.username == username).first()


def getAllUsers(db: Session) -> list[models.User]:
    return db.query(models.User).all()


def createUser(db: Session, payload: schemas.UserCreate) -> models.User:
    user = models.User(
        name=payload.name,
        username=payload.username,
        hashedPassword=hashPassword(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def seedDefaultUsers(db: Session):
    defaults = [
        {
            "name": os.getenv("ADMIN_NAME", "Admin User"),
            "username": os.getenv("ADMIN_USERNAME", "admin"),
            "password": os.getenv("ADMIN_PASSWORD", "admin123"),
            "role": "admin",
        },
        {
            "name": os.getenv("OPERATOR_NAME", "Warehouse Operator"),
            "username": os.getenv("OPERATOR_USERNAME", "operator"),
            "password": os.getenv("OPERATOR_PASSWORD", "op123"),
            "role": "operator",
        },
    ]
    for d in defaults:
        if not getUserByUsername(db, d["username"]):
            createUser(db, schemas.UserCreate(**d))
