from fastapi import FastAPI
from database import engine, Base
from neo.routes import router as neo_router
from auth.routes import router as auth_router
from alerts.scheduler import start_scheduler

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NEO Monitoring",
    description="Interstellar Asteroid Tracker & Risk Analyzer",
    version="1.0.0"
)

@app.get("/")
def health_check():
    return {"status": "Cosmic Watch backend running 🚀"}


app.include_router(neo_router)

app.include_router(auth_router)

start_scheduler()



