from datetime import date

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from auth import requireAdmin
from db import getDb, crud
import schemas

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("", response_model=list[schemas.VerificationLogOut])
def getReport(
    startDate: date,
    endDate: date,
    db: Session = Depends(getDb),
    currentUser=Depends(requireAdmin),
):
    return crud.getLogsByDateRange(db, startDate, endDate)


@router.get("/export")
def exportReportCsv(
    startDate: date,
    endDate: date,
    db: Session = Depends(getDb),
    currentUser=Depends(requireAdmin),
):
    logs = crud.getLogsByDateRange(db, startDate, endDate)

    lines = ["ID,WID,EAN,Operator,Timestamp,Photo\n"]
    for log in logs:
        lines.append(
            f"{log.id},{log.wid},{log.product.ean if log.product else ''},"
            f"{log.user.name},{log.verifiedAt},{log.hasPhoto}\n"
        )

    filename = f"report_{startDate}_{endDate}.csv"
    return StreamingResponse(
        iter(lines),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
