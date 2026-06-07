from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import verifyPassword, createAccessToken, getCurrentUser
from db import getDb, crud
import schemas

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=schemas.TokenResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(getDb)):
    user = crud.getUserByUsername(db, payload.username)
    if not user or not verifyPassword(payload.password, user.hashedPassword):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = createAccessToken({"sub": str(user.id), "role": user.role})
    return {"accessToken": token, "tokenType": "bearer", "user": user}


@router.get("/me", response_model=schemas.UserOut)
def me(currentUser=Depends(getCurrentUser)):
    return currentUser
