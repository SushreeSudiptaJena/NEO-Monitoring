from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.database import engine, Base

from neo.routes import router as neo_router
from auth.routes import router as auth_router
from alerts.routes import router as alerts_router
from alerts.scheduler import start_scheduler

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NEO Monitoring",
    description="Interstellar Asteroid Tracker & Risk Analyzer",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "Cosmic Watch backend running 🚀"}


app.include_router(neo_router)

app.include_router(auth_router)

app.include_router(alerts_router)

start_scheduler()



