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
EMERGENT_EMAIL_KEY = os.environ.get("EMERGENT_EMAIL_KEY", "")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "PETZZY Ops")
OPS_EMAIL = os.environ.get("OPS_EMAIL", "ops@petzzy.com")
EMAIL_BASE_URL = "https://integrations.emergentagent.com"
BIN_FULL_THRESHOLD = 90.0

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
# Sponsors (public list/detail + admin CRUD)
# ---------------------------------------------------------------------------
class SponsorIn(BaseModel):
    name: str
    slug: str
    tagline: str = ""
    description: str = ""
    logo_url: str = ""
    hero_url: str = ""
    website: str = ""
    bin_ids: List[str] = Field(default_factory=list)

@api.get("/sponsors")
async def list_sponsors():
    return await db.sponsors.find({}, {"_id": 0}).to_list(200)

@api.get("/sponsors/{slug}")
async def get_sponsor(slug: str):
    sponsor = await db.sponsors.find_one({"slug": slug}, {"_id": 0})
    if not sponsor:
        raise HTTPException(status_code=404, detail="Sponsor not found")
    bins = await db.bins.find({"bin_id": {"$in": sponsor.get("bin_ids", [])}}, {"_id": 0}).to_list(200)
    impact = {
        "bins_funded": len(bins),
        "animals_fed_total": sum(b.get("animals_fed_today", 0) for b in bins) * 30,  # naive month projection
        "waste_recycled_kg": round(sum(b.get("waste_recycled_kg", 0) for b in bins), 1),
        "pellets_ready_kg": round(sum(b.get("pellets_kg", 0) for b in bins), 1),
    }
    return {"sponsor": sponsor, "bins": bins, "impact": impact}

@api.post("/admin/sponsors")
async def create_sponsor(body: SponsorIn, _: dict = Depends(require_admin)):
    slug = body.slug.strip().lower()
    if await db.sponsors.find_one({"slug": slug}):
        raise HTTPException(status_code=400, detail="Slug already exists")
    doc = body.model_dump()
    doc["slug"] = slug
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.sponsors.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.delete("/admin/sponsors/{slug}")
async def delete_sponsor(slug: str, _: dict = Depends(require_admin)):
    result = await db.sponsors.delete_one({"slug": slug})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sponsor not found")
    return {"ok": True}

# ---------------------------------------------------------------------------
# Email alerts (bin > 90% full) — Emergent-managed Resend
# ---------------------------------------------------------------------------
async def send_email(to_email: str, subject: str, html: str) -> dict:
    if not EMERGENT_EMAIL_KEY:
        logger.warning("EMERGENT_EMAIL_KEY not set — email to %s SIMULATED. Subject: %s", to_email, subject)
        return {"status": "simulated", "recipient": to_email}
    payload = {
        "to": [to_email],
        "subject": subject,
        "html": html,
        "from_name": EMAIL_FROM_NAME,
    }
    try:
        async with httpx.AsyncClient(timeout=15) as hc:
            r = await hc.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": EMERGENT_EMAIL_KEY},
                json=payload,
            )
        r.raise_for_status()
        return {"status": "sent", "recipient": to_email, "id": r.json().get("id")}
    except Exception as e:
        logger.error("Email send failed to %s: %s", to_email, e)
        return {"status": "failed", "recipient": to_email, "error": str(e)}

def _bin_alert_html(bin_doc: dict) -> str:
    return f"""
    <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;background:#f4f6f5;padding:24px">
      <tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#0A140E;border-radius:16px;overflow:hidden;color:#F9F9F6">
          <tr><td style="padding:28px 32px;border-bottom:1px solid #1B3324">
            <div style="font-size:12px;letter-spacing:3px;color:#90EE90">PETZZY ALERT</div>
            <div style="font-size:24px;font-weight:800;margin-top:6px">Bin {bin_doc.get('bin_id')} needs pickup.</div>
          </td></tr>
          <tr><td style="padding:24px 32px">
            <div style="font-size:15px;line-height:1.6;color:#D6DED8">
              <b>{bin_doc.get('name')}</b> is at
              <span style="color:#FF453A;font-weight:700">{bin_doc.get('fill_percent')}% full</span>.
              Please dispatch a pickup crew.
            </div>
            <table cellpadding="8" cellspacing="0" style="margin-top:20px;background:#122419;border-radius:12px;border:1px solid #1B3324;width:100%">
              <tr><td style="color:#A3B8AA;font-size:12px">LOCATION</td><td style="color:#F9F9F6">{bin_doc.get('name')}</td></tr>
              <tr><td style="color:#A3B8AA;font-size:12px">GPS</td><td style="color:#F9F9F6;font-family:monospace">{bin_doc.get('lat')}, {bin_doc.get('lng')}</td></tr>
              <tr><td style="color:#A3B8AA;font-size:12px">FILL</td><td style="color:#FF453A;font-weight:700">{bin_doc.get('fill_percent')}%</td></tr>
              <tr><td style="color:#A3B8AA;font-size:12px">PELLETS</td><td style="color:#F9F9F6">{bin_doc.get('pellets_kg')} kg ready to dispense</td></tr>
              <tr><td style="color:#A3B8AA;font-size:12px">BATTERY</td><td style="color:#F9F9F6">{bin_doc.get('battery_percent')}%</td></tr>
            </table>
            <div style="margin-top:22px;font-size:13px;color:#A3B8AA">— PETZZY IoT · Feed. Recycle. Repeat.</div>
          </td></tr>
        </table>
      </td></tr>
    </table>
    """

@api.post("/admin/alerts/check")
async def check_bin_alerts(_: dict = Depends(require_admin)):
    """Scan all bins; for any over threshold that haven't been alerted since last refill, send emails."""
    bins = await db.bins.find({}, {"_id": 0}).to_list(500)
    admins = await db.users.find({"role": "admin"}, {"_id": 0, "email": 1}).to_list(500)
    recipients = list({u["email"] for u in admins if u.get("email")}) + [OPS_EMAIL]
    recipients = list({r.lower() for r in recipients if r})

    alerted = []
    skipped = []
    for b in bins:
        if b.get("fill_percent", 0) <= BIN_FULL_THRESHOLD:
            continue
        last_alert_ts = b.get("last_alert_at")
        last_refill_ts = b.get("last_refilled")
        # skip if we've already alerted since last refill
        if last_alert_ts and last_refill_ts and last_alert_ts > last_refill_ts:
            skipped.append(b["bin_id"])
            continue

        subject = f"[PETZZY] Bin {b['bin_id']} at {b['fill_percent']}% — dispatch pickup"
        html = _bin_alert_html(b)
        results = []
        for rcpt in recipients:
            results.append(await send_email(rcpt, subject, html))
        await db.bins.update_one(
            {"bin_id": b["bin_id"]},
            {"$set": {"last_alert_at": datetime.now(timezone.utc).isoformat()}},
        )
        alerted.append({"bin_id": b["bin_id"], "recipients": recipients, "results": results})

    return {
        "threshold_percent": BIN_FULL_THRESHOLD,
        "recipients": recipients,
        "alerted": alerted,
        "skipped_already_alerted": skipped,
        "email_key_configured": bool(EMERGENT_EMAIL_KEY),
    }


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

SPONSORS_SEED = [
    {
        "name": "Ather CSR",
        "slug": "ather-csr",
        "tagline": "Cleaner streets, greener rides.",
        "description": "Ather Energy funds PETZZY bins across South Chennai as part of its urban sustainability CSR pledge — turning food waste into feed while cleaning up neighbourhoods around Ather Grid stations.",
        "logo_url": "https://images.unsplash.com/photo-1618176976416-a9ce8f0d21e5?w=200",
        "hero_url": "https://images.unsplash.com/photo-1777571051052-6ad3c7031811?w=1600",
        "website": "https://atherenergy.com",
        "bin_ids": ["PZ-004", "PZ-005", "PZ-007"],
    },
    {
        "name": "TVS Motors",
        "slug": "tvs-motors",
        "tagline": "Every kilometre, a kindness.",
        "description": "TVS Motors sponsors PETZZY units around Chennai's central business district and rail hubs, aligned with its Swachh Bharat and animal welfare CSR mandates.",
        "logo_url": "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=200",
        "hero_url": "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=1600",
        "website": "https://tvsmotor.com",
        "bin_ids": ["PZ-001", "PZ-008", "PZ-009"],
    },
    {
        "name": "TataOne Foundation",
        "slug": "tataone",
        "tagline": "Feed the four-legged citizen.",
        "description": "TataOne Foundation funds coastal PETZZY units — Marina, Besant Nagar and Perambur — combining beach cleanup with humane animal feeding.",
        "logo_url": "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=200",
        "hero_url": "https://images.unsplash.com/photo-1721902187342-ab4e59f36d9b?w=1600",
        "website": "https://tata.com",
        "bin_ids": ["PZ-002", "PZ-006", "PZ-010"],
    },
]

async def seed_sponsors():
    if await db.sponsors.count_documents({}) > 0:
        return
    docs = []
    for s in SPONSORS_SEED:
        docs.append({**s, "created_at": datetime.now(timezone.utc).isoformat()})
    await db.sponsors.insert_many(docs)
    logger.info("Seeded %d sponsors", len(docs))

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.bins.create_index("bin_id", unique=True)
    await db.sponsors.create_index("slug", unique=True)
    await seed_admin()
    await seed_bins()
    await seed_cameras()
    await seed_sponsors()

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
