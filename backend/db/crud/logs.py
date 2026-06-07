from datetime import date, datetime, time, timezone

from sqlalchemy.orm import Session, joinedload

from .. import models
import schemas


def createVerificationLog(
    db: Session,
    payload: schemas.VerificationLogCreate,
    userId: int,
) -> models.VerificationLog:
    log = models.VerificationLog(
        wid=payload.wid,
        userId=userId,
        hasPhoto=payload.hasPhoto,
        photoUrl=payload.photoUrl,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def getLogsByDateRange(
    db: Session,
    startDate: date,
    endDate: date,
) -> list[models.VerificationLog]:
    startDt = datetime.combine(startDate, time.min, tzinfo=timezone.utc)
    endDt = datetime.combine(endDate, time.max, tzinfo=timezone.utc)
    return (
        db.query(models.VerificationLog)
        .options(
            joinedload(models.VerificationLog.product),
            joinedload(models.VerificationLog.user),
        )
        .filter(
            models.VerificationLog.verifiedAt >= startDt,
            models.VerificationLog.verifiedAt <= endDt,
        )
        .order_by(models.VerificationLog.verifiedAt.desc())
        .all()
    )
