from apscheduler.schedulers.background import BackgroundScheduler
from database import SessionLocal
from models import WatchedAsteroid

def check_alerts():
    db = SessionLocal()
    asteroids = db.query(WatchedAsteroid).all()

    alerts = []
    for a in asteroids:
        if a.risk_score >= 50:
            alerts.append(
                f"⚠️ ALERT: {a.name} has high risk score {a.risk_score}"
            )

    if alerts:
        print("\n".join(alerts))

def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(check_alerts, "interval", minutes=30)
    scheduler.start()
