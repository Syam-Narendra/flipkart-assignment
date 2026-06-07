from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import getCurrentUser
from db import getDb, crud
import schemas

router = APIRouter(prefix="/verify", tags=["verification"])


@router.get("/{wid}", response_model=schemas.ProductOut)
def verifyProduct(
    wid: str,
    db: Session = Depends(getDb),
    currentUser=Depends(getCurrentUser),
):
    product = crud.getProductByWid(db, wid)
    if not product:
        raise HTTPException(status_code=404, detail=f"WID '{wid}' not found in system")
    return product


@router.post("/log", response_model=schemas.VerificationLogOut, status_code=201)
def logVerification(
    payload: schemas.VerificationLogCreate,
    db: Session = Depends(getDb),
    currentUser=Depends(getCurrentUser),
):
    product = crud.getProductByWid(db, payload.wid)
    if not product:
        raise HTTPException(status_code=404, detail="WID not found")
    return crud.createVerificationLog(db, payload, userId=currentUser.id)
