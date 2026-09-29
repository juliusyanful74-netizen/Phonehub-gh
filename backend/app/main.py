from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional

app = FastAPI(title="PhoneHub API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PhoneCreate(BaseModel):
    title: str = Field(..., min_length=3)
    brand: str = Field(..., min_length=2)
    model: str = Field(..., min_length=2)
    price: float = Field(..., gt=0)
    condition: str = Field(default="Used")
    seller_name: str = Field(..., min_length=2)
    description: Optional[str] = ""
    location: str = Field(default="Unknown")

class PhoneOut(BaseModel):
    id: int
    title: str
    brand: str
    model: str
    price: float
    condition: str
    seller_name: str
    description: Optional[str]
    location: str

phones: List[PhoneOut] = [
    PhoneOut(
        id=1,
        title="iPhone 14 Pro",
        brand="Apple",
        model="14 Pro",
        price=780.0,
        condition="Good",
        seller_name="Kojo",
        description="Unlocked, with box and charger.",
        location="Accra",
    ),
    PhoneOut(
        id=2,
        title="Samsung Galaxy S23",
        brand="Samsung",
        model="S23",
        price=620.0,
        condition="Excellent",
        seller_name="Ama",
        description="No scratches, battery health above 90%.",
        location="Kumasi",
    )
]

@app.get("/health")
def health_check():
    return {"status": "ok", "app": "PhoneHub API"}

@app.get("/phones", response_model=List[PhoneOut])
def get_phones():
    return phones

@app.post("/phones", response_model=PhoneOut)
def create_phone(phone: PhoneCreate):
    new_id = max((p.id for p in phones), default=0) + 1
    item = PhoneOut(
        id=new_id,
        title=phone.title,
        brand=phone.brand,
        model=phone.model,
        price=phone.price,
        condition=phone.condition,
        seller_name=phone.seller_name,
        description=phone.description,
        location=phone.location,
    )
    phones.append(item)
    return item
