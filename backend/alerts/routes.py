from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user
from db.database import get_db
from models import AlertNotification, User


router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("")
def list_alerts(
    unread_only: bool = True,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(AlertNotification).filter(AlertNotification.owner_id == user.id)
    if unread_only:
        q = q.filter(AlertNotification.is_read == False)  # noqa: E712
    return q.order_by(AlertNotification.id.desc()).limit(50).all()


@router.post("/mark-read")
def mark_all_read(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(AlertNotification).filter(
        AlertNotification.owner_id == user.id,
        AlertNotification.is_read == False,  # noqa: E712
    ).update({"is_read": True})
    db.commit()
    return {"message": "ok", "at": datetime.utcnow().isoformat()}
