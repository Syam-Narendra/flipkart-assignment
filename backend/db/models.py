from sqlalchemy import Column, Integer, String, Date, DateTime, Boolean, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    username = Column(String(50), unique=True, nullable=False, index=True)
    hashedPassword = Column("hashed_password", String(200), nullable=False)
    role = Column(String(20), nullable=False, default="operator")
    createdAt = Column("created_at", DateTime(timezone=True), server_default=func.now())

    logs = relationship("VerificationLog", back_populates="user")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    wid = Column(String(100), unique=True, nullable=False, index=True)
    ean = Column(String(20), nullable=False, index=True)
    manufacturingDate = Column("manufacturing_date", Date, nullable=False)
    expiryDate = Column("expiry_date", Date, nullable=False, index=True)
    createdAt = Column("created_at", DateTime(timezone=True), server_default=func.now())

    logs = relationship("VerificationLog", back_populates="product")

    __table_args__ = (
        Index("ix_products_ean_expiry", "ean", "expiry_date"),
    )


class VerificationLog(Base):
    __tablename__ = "verification_logs"

    id = Column(Integer, primary_key=True, index=True)
    wid = Column(String(100), ForeignKey("products.wid"), nullable=False)
    userId = Column("user_id", Integer, ForeignKey("users.id"), nullable=False)
    verifiedAt = Column("verified_at", DateTime(timezone=True), server_default=func.now(), index=True)
    hasPhoto = Column("has_photo", Boolean, default=False)
    photoUrl = Column("photo_url", String(500), nullable=True)

    product = relationship("Product", back_populates="logs")
    user = relationship("User", back_populates="logs")

    __table_args__ = (
        Index("ix_logs_verified_at", "verified_at"),
    )
