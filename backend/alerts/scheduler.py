from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
from db.database import SessionLocal
from models import AlertNotification, WatchedAsteroid, WatchedAsteroidMeta

def check_alerts():
    db = SessionLocal()
    try:
        asteroids = db.query(WatchedAsteroid).all()
        watched_ids = [a.id for a in asteroids]
        metas = {}
        if watched_ids:
            for m in db.query(WatchedAsteroidMeta).filter(WatchedAsteroidMeta.watched_id.in_(watched_ids)).all():
                metas[m.watched_id] = m

        now = datetime.utcnow()

        for a in asteroids:
            m = metas.get(a.id)
            if not m:
                continue

            threshold = float(m.alert_risk_threshold or 50)
            if (a.risk_score or 0) < threshold:
                continue

            if not m.close_approach_date:
                continue

            # NASA feed gives YYYY-MM-DD
            try:
                approach_dt = datetime.strptime(m.close_approach_date, "%Y-%m-%d")
            except Exception:
                continue

            window_hours = int(m.alert_window_hours or 72)
            if approach_dt < now:
                continue

            if approach_dt > now + timedelta(hours=window_hours):
                continue

            # Avoid spamming: only one unread alert per watched_id
            exists = db.query(AlertNotification).filter(
                AlertNotification.owner_id == a.owner_id,
                AlertNotification.watched_id == a.id,
                AlertNotification.is_read == False,  # noqa: E712
            ).first()

            if exists:
                continue

            msg = (
                f"⚠️ Close approach soon: {a.name} on {m.close_approach_date} "
                f"(risk {a.risk_score:.2f}, threshold {threshold:.0f})"
            )
            db.add(
                AlertNotification(
                    owner_id=a.owner_id,
                    watched_id=a.id,
                    message=msg,
                    created_at=now.isoformat(),
                    is_read=False,
                )
            )
        db.commit()
    finally:
        db.close()

def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(check_alerts, "interval", minutes=30)
    scheduler.start()
