from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db import engine, crud, Base, SessionLocal
from routes import authRouter, usersRouter, productsRouter, verifyRouter, reportsRouter

Base.metadata.create_all(bind=engine)

db = SessionLocal()
try:
    crud.seedDefaultUsers(db)
finally:
    db.close()

app = FastAPI(
    title="VerifyChain API",
    description="Flipkart Supply Chain Product Verification System",
    version="1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "https://syam-flipkart-assignment.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(authRouter)
app.include_router(usersRouter)
app.include_router(productsRouter)
app.include_router(verifyRouter)
app.include_router(reportsRouter)


@app.get("/")
def root():
    return {"message": "Welcome to the API"}


@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}
