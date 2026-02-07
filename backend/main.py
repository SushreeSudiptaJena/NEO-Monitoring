from fastapi import FastAPI

app = FastAPI(title="NEO Monitoring")

@app.get("/")
def root():
    return {"status": "Backend running"}
