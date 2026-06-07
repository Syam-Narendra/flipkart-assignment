import csv
import io
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from auth import requireAdmin, getCurrentUser
from db import getDb, crud
import schemas

router = APIRouter(prefix="/products", tags=["products"])


@router.post("/upload", response_model=schemas.UploadResult)
async def uploadProducts(
    file: UploadFile = File(...),
    db: Session = Depends(getDb),
    currentUser=Depends(requireAdmin),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")

    content = await file.read()
    decoded = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(decoded))

    required = {"WID", "EAN", "Manufacturing_Date", "Expiry_Date"}
    if not required.issubset(set(reader.fieldnames or [])):
        raise HTTPException(status_code=422, detail=f"CSV must contain columns: {required}")

    inserted, duplicates, errors = 0, 0, 0
    batch = 500
    batchList = []

    for row in reader:
        try:
            product = schemas.ProductCreate(
                wid=row["WID"].strip(),
                ean=row["EAN"].strip(),
                manufacturingDate=date.fromisoformat(row["Manufacturing_Date"].strip()),
                expiryDate=date.fromisoformat(row["Expiry_Date"].strip()),
            )
            batchList.append(product)
            if len(batchList) >= batch:
                r = crud.bulkInsertProducts(db, batchList)
                inserted += r["inserted"]
                duplicates += r["duplicates"]
                batchList = []
        except Exception:
            errors += 1

    if batchList:
        r = crud.bulkInsertProducts(db, batchList)
        inserted += r["inserted"]
        duplicates += r["duplicates"]

    return {"inserted": inserted, "duplicates": duplicates, "errors": errors}


@router.get("", response_model=list[schemas.ProductOut])
def listProducts(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(getDb),
    currentUser=Depends(getCurrentUser),
):
    return crud.getProducts(db, skip=skip, limit=limit)
