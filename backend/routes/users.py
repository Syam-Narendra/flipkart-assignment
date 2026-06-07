from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import requireAdmin
from db import getDb, crud
import schemas

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[schemas.UserOut])
def listUsers(
    db: Session = Depends(getDb),
    currentUser=Depends(requireAdmin),
):
    return crud.getAllUsers(db)


@router.post("", response_model=schemas.UserOut, status_code=201)
def createUser(
    payload: schemas.UserCreate,
    db: Session = Depends(getDb),
    currentUser=Depends(requireAdmin),
):
    if crud.getUserByUsername(db, payload.username):
        raise HTTPException(status_code=400, detail="Username already exists")
    return crud.createUser(db, payload)
