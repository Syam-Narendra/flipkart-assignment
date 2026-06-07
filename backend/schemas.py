from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    accessToken: str
    tokenType: str
    user: "UserOut"


class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=4)
    role: str = Field(default="operator", pattern="^(admin|operator)$")


class UserOut(BaseModel):
    id: int
    name: str
    username: str
    role: str
    createdAt: datetime

    model_config = {"from_attributes": True}


class ProductCreate(BaseModel):
    wid: str = Field(..., min_length=1, max_length=100)
    ean: str = Field(..., min_length=8, max_length=20)
    manufacturingDate: date
    expiryDate: date


class ProductOut(BaseModel):
    id: int
    wid: str
    ean: str
    manufacturingDate: date
    expiryDate: date
    createdAt: datetime

    model_config = {"from_attributes": True}


class UploadResult(BaseModel):
    inserted: int
    duplicates: int
    errors: int


class VerificationLogCreate(BaseModel):
    wid: str
    hasPhoto: bool = False
    photoUrl: Optional[str] = None


class VerificationLogOut(BaseModel):
    id: int
    wid: str
    verifiedAt: datetime
    hasPhoto: bool
    photoUrl: Optional[str]
    user: UserOut
    product: Optional["ProductOut"] = None

    model_config = {"from_attributes": True}


TokenResponse.model_rebuild()
