# PhoneHub

PhoneHub is a mobile marketplace app for buying and selling mobile phones.

## Tech stack
- Mobile app: React Native (Expo)
- Backend API: Python (FastAPI)
- Database: SQLite for MVP

## Project structure
- `frontend/` - React Native mobile app
- `backend/` - FastAPI API server

## Getting started

### 1) Frontend
```bash
cd frontend
npm install
npm start
```

### 2) Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Default API
- Health check: http://localhost:8000/health
- List listings: http://localhost:8000/phones
- Create listing: POST to http://localhost:8000/phones

## Notes
This is the initial MVP foundation for the app. The next steps will include authentication, real listings, image upload, and a cleaner marketplace UI.
