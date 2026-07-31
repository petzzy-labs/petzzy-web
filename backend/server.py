from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import io
import uuid
import bcrypt
import jwt
import random
import logging
import httpx
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from openpyxl import Workbook

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
JWT_ALGORITHM = "HS256"
JWT_SECRET = os.environ["JWT_SECRET"]
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@petzzy.com").lower()
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "petzzyadmin123")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="Petzzy API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("petzzy")

# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 3600,
        path="/",
    )

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1)
    phone: Optional[str] = None
    city: Optional[str] = None

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class GoogleSessionIn(BaseModel):
    session_id: str

class BinRefillIn(BaseModel):
    pellets_added_kg: float = 5.0

# ---------------------------------------------------------------------------
# Auth endpoints
# ---------------------------------------------------------------------------
@api.post("/auth/register")
async def register(body: RegisterIn, response: Response):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    doc = {
        "user_id": user_id,
        "email": email,
        "name": body.name,
        "phone": body.phone or "",
        "city": body.city or "",
        "role": "user",
        "auth_provider": "password",
        "password_hash": hash_password(body.password),
        "picture": "",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    token = create_access_token(user_id, email)
    set_auth_cookie(response, token)
    doc.pop("password_hash", None)
    doc.pop("_id", None)
    return {"user": doc, "token": token}

@api.post("/auth/login")
async def login(body: LoginIn, response: Response):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not user.get("password_hash") or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["user_id"], email)
    set_auth_cookie(response, token)
    user.pop("password_hash", None)
    user.pop("_id", None)
    return {"user": user, "token": token}

@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user

@api.post("/auth/google/session")
async def google_session(body: GoogleSessionIn, response: Response):
    """Exchange Emergent Google Auth session_id for our own JWT."""
    try:
        async with httpx.AsyncClient(timeout=10) as hc:
            r = await hc.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": body.session_id},
            )
        if r.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Google session")
        data = r.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Google auth service unreachable: {e}")

    email = (data.get("email") or "").lower()
    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email")

    existing = await db.users.find_one({"email": email})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": data.get("name", existing.get("name")), "picture": data.get("picture", "")}},
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": data.get("name", ""),
            "picture": data.get("picture", ""),
            "phone": "",
            "city": "",
            "role": "user",
            "auth_provider": "google",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    token = create_access_token(user_id, email)
    set_auth_cookie(response, token)
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return {"user": user, "token": token}

# ---------------------------------------------------------------------------
# Bin & camera endpoints (public)
# ---------------------------------------------------------------------------
@api.get("/bins")
async def list_bins():
    bins = await db.bins.find({}, {"_id": 0}).to_list(200)
    # add small live jitter to simulate real-time
    for b in bins:
        drift = random.uniform(-1.5, 2.5)
        b["fill_percent"] = max(0, min(100, round(b.get("fill_percent", 50) + drift, 1)))
    return bins

@api.get("/cameras")
async def list_cameras():
    return await db.cameras.find({}, {"_id": 0}).to_list(50)

@api.get("/stats")
async def stats():
    total_bins = await db.bins.count_documents({})
    users_count = await db.users.count_documents({})
    bins = await db.bins.find({}, {"_id": 0}).to_list(200)
    total_pellets = sum(b.get("pellets_kg", 0) for b in bins)
    animals_fed = sum(b.get("animals_fed_today", 0) for b in bins)
    waste_recycled = sum(b.get("waste_recycled_kg", 0) for b in bins)
    return {
        "total_bins": total_bins,
        "users_count": users_count,
        "total_pellets_kg": round(total_pellets, 1),
        "animals_fed_today": animals_fed,
        "waste_recycled_kg": round(waste_recycled, 1),
        "cities": 1,
    }

# ---------------------------------------------------------------------------
# Admin endpoints
# ---------------------------------------------------------------------------
@api.get("/admin/users")
async def admin_users(_: dict = Depends(require_admin)):
    return await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)

@api.get("/admin/users/export")
async def admin_users_export(_: dict = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(5000)
    wb = Workbook()
    ws = wb.active
    ws.title = "Petzzy Users"
    headers = ["User ID", "Name", "Email", "Phone", "City", "Role", "Auth Provider", "Created At"]
    ws.append(headers)
    for u in users:
        ws.append([
            u.get("user_id", ""),
            u.get("name", ""),
            u.get("email", ""),
            u.get("phone", ""),
            u.get("city", ""),
            u.get("role", ""),
            u.get("auth_provider", ""),
            u.get("created_at", ""),
        ])
    # style header
    for cell in ws[1]:
        cell.font = cell.font.copy(bold=True)
    for col_letter in ["A", "B", "C", "D", "E", "F", "G", "H"]:
        ws.column_dimensions[col_letter].width = 22

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="petzzy_users.xlsx"'},
    )

@api.get("/admin/bins")
async def admin_bins(_: dict = Depends(require_admin)):
    return await db.bins.find({}, {"_id": 0}).to_list(200)

@api.post("/admin/bins/{bin_id}/refill")
async def refill_bin(bin_id: str, body: BinRefillIn, _: dict = Depends(require_admin)):
    result = await db.bins.update_one(
        {"bin_id": bin_id},
        {"$set": {"pellets_kg": 20.0, "fill_percent": 5.0, "last_refilled": datetime.now(timezone.utc).isoformat()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Bin not found")
    return {"ok": True, "bin_id": bin_id, "pellets_added_kg": body.pellets_added_kg}

# ---------------------------------------------------------------------------
# Seeding
# ---------------------------------------------------------------------------
CHENNAI_BINS = [
    ("PZ-001", "T. Nagar Market", 13.0418, 80.2337),
    ("PZ-002", "Marina Beach", 13.0500, 80.2824),
    ("PZ-003", "Anna Nagar Tower Park", 13.0850, 80.2101),
    ("PZ-004", "Adyar Signal", 13.0067, 80.2570),
    ("PZ-005", "Velachery MRTS", 12.9750, 80.2200),
    ("PZ-006", "Besant Nagar Beach", 12.9975, 80.2669),
    ("PZ-007", "Guindy Race Course", 13.0067, 80.2206),
    ("PZ-008", "Egmore Station", 13.0730, 80.2609),
    ("PZ-009", "Mylapore Kapaleeshwarar", 13.0339, 80.2696),
    ("PZ-010", "Perambur Rail Nagar", 13.1147, 80.2330),
]

CAMERA_FEEDS = [
    {
        "camera_id": "CAM-01",
        "bin_id": "PZ-002",
        "location": "Marina Beach",
        "video_url": "https://videos.pexels.com/video-files/4763824/4763824-uhd_2560_1440_25fps.mp4",
        "poster": "https://images.unsplash.com/photo-1583511655802-41f6d0f5b70f?w=1200",
        "detected": ["Dog", "Bowl"],
        "confidence": 96,
    },
    {
        "camera_id": "CAM-02",
        "bin_id": "PZ-004",
        "location": "Adyar Signal",
        "video_url": "https://videos.pexels.com/video-files/5726035/5726035-uhd_2560_1440_25fps.mp4",
        "poster": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200",
        "detected": ["Dog x2"],
        "confidence": 93,
    },
    {
        "camera_id": "CAM-03",
        "bin_id": "PZ-006",
        "location": "Besant Nagar Beach",
        "video_url": "https://videos.pexels.com/video-files/8722869/8722869-hd_1920_1080_30fps.mp4",
        "poster": "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=1200",
        "detected": ["Cat"],
        "confidence": 89,
    },
    {
        "camera_id": "CAM-04",
        "bin_id": "PZ-009",
        "location": "Mylapore",
        "video_url": "https://videos.pexels.com/video-files/4763824/4763824-uhd_2560_1440_25fps.mp4",
        "poster": "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=1200",
        "detected": ["Puppy", "Puppy"],
        "confidence": 98,
    },
]

async def seed_admin():
    existing = await db.users.find_one({"email": ADMIN_EMAIL})
    if existing is None:
        await db.users.insert_one({
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": ADMIN_EMAIL,
            "name": "Petzzy Admin",
            "role": "admin",
            "auth_provider": "password",
            "password_hash": hash_password(ADMIN_PASSWORD),
            "phone": "",
            "city": "Chennai",
            "picture": "",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Seeded admin user %s", ADMIN_EMAIL)
    elif not verify_password(ADMIN_PASSWORD, existing.get("password_hash", "")):
        await db.users.update_one(
            {"email": ADMIN_EMAIL},
            {"$set": {"password_hash": hash_password(ADMIN_PASSWORD), "role": "admin"}},
        )

async def seed_bins():
    count = await db.bins.count_documents({})
    if count > 0:
        return
    docs = []
    for bin_id, name, lat, lng in CHENNAI_BINS:
        fill = random.randint(20, 95)
        pellets = round(random.uniform(2.0, 18.5), 1)
        docs.append({
            "bin_id": bin_id,
            "name": name,
            "lat": lat,
            "lng": lng,
            "fill_percent": fill,
            "pellets_kg": pellets,
            "pellet_dispenser_percent": round(pellets / 20 * 100, 1),
            "battery_percent": random.randint(55, 100),
            "solar_charging": random.choice([True, True, False]),
            "temperature_c": round(random.uniform(28, 34), 1),
            "ph_sensor_ok": True,
            "ai_camera_ok": True,
            "animals_fed_today": random.randint(3, 40),
            "waste_recycled_kg": round(random.uniform(15, 120), 1),
            "status": "online",
            "last_refilled": (datetime.now(timezone.utc) - timedelta(days=random.randint(0, 5))).isoformat(),
        })
    await db.bins.insert_many(docs)
    logger.info("Seeded %d bins", len(docs))

async def seed_cameras():
    if await db.cameras.count_documents({}) > 0:
        return
    await db.cameras.insert_many(CAMERA_FEEDS)
    logger.info("Seeded %d cameras", len(CAMERA_FEEDS))

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.bins.create_index("bin_id", unique=True)
    await seed_admin()
    await seed_bins()
    await seed_cameras()

@app.on_event("shutdown")
async def shutdown():
    client.close()

# ---------------------------------------------------------------------------
# App wiring
# ---------------------------------------------------------------------------
@api.get("/")
async def root():
    return {"service": "petzzy", "ok": True}

app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
