from sqlalchemy import insert as saInsert
from sqlalchemy.orm import Session

from .. import models
import schemas


def getProducts(db: Session, skip: int = 0, limit: int = 100) -> list[models.Product]:
    return db.query(models.Product).offset(skip).limit(limit).all()


def getProductByWid(db: Session, wid: str) -> models.Product | None:
    return db.query(models.Product).filter(models.Product.wid == wid).first()


def bulkInsertProducts(db: Session, products: list[schemas.ProductCreate]) -> dict:
    inserted = 0
    duplicates = 0

    wids = [p.wid for p in products]
    existingWids = {
        row.wid
        for row in db.query(models.Product.wid).filter(models.Product.wid.in_(wids)).all()
    }

    newRows = []
    for p in products:
        if p.wid in existingWids:
            duplicates += 1
        else:
            newRows.append({
                "wid": p.wid,
                "ean": p.ean,
                "manufacturingDate": p.manufacturingDate,
                "expiryDate": p.expiryDate,
            })
            existingWids.add(p.wid)
            inserted += 1

    if newRows:
        db.execute(saInsert(models.Product), newRows)
        db.commit()

    return {"inserted": inserted, "duplicates": duplicates}
