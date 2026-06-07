import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

databaseUrl = os.environ["DATABASE_URL"]

engine = create_engine(
    databaseUrl,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def getDb():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
