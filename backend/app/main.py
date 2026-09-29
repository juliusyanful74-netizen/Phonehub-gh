from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import Column, Float, Integer, String, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from typing import List, Optional

DATABASE_URL = "sqlite:///./phones.db"

class Base(DeclarativeBase):
    pass

class Phone(Base):
    __tablename__ = "phones"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    brand = Column(String, nullable=False)
    model = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    condition = Column(String, default="Used")
    seller_name = Column(String, nullable=False)
    description = Column(String, default="")
    location = Column(String, default="Unknown")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="PhoneHub API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


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


def serialize_phone(phone: Phone) -> PhoneOut:
    return PhoneOut(
        id=phone.id,
        title=phone.title,
        brand=phone.brand,
        model=phone.model,
        price=phone.price,
        condition=phone.condition,
        seller_name=phone.seller_name,
        description=phone.description,
        location=phone.location,
    )


@app.get("/health")
def health_check():
    return {"status": "ok", "app": "PhoneHub API"}


@app.get("/phones", response_model=List[PhoneOut])
def get_phones(db: Session = Depends(get_db)):
    rows = db.query(Phone).all()
    if not rows:
        seed_data = [
            Phone(
                title="iPhone 14 Pro",
                brand="Apple",
                model="14 Pro",
                price=780.0,
                condition="Good",
                seller_name="Kojo",
                description="Unlocked, with box and charger.",
                location="Accra",
            ),
            Phone(
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
        db.add_all(seed_data)
        db.commit()
        rows = db.query(Phone).all()

    return [serialize_phone(row) for row in rows]


@app.get("/phones/{phone_id}", response_model=PhoneOut)
def get_phone(phone_id: int, db: Session = Depends(get_db)):
    phone = db.query(Phone).filter(Phone.id == phone_id).first()
    if not phone:
        raise HTTPException(status_code=404, detail="Phone not found")
    return serialize_phone(phone)


@app.post("/phones", response_model=PhoneOut)
def create_phone(phone: PhoneCreate, db: Session = Depends(get_db)):
    item = Phone(
        title=phone.title,
        brand=phone.brand,
        model=phone.model,
        price=phone.price,
        condition=phone.condition,
        seller_name=phone.seller_name,
        description=phone.description,
        location=phone.location,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return serialize_phone(item)
