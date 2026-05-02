from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import uuid
import re
import secrets
import requests
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Query, status, UploadFile, File, Header
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict


# ----------------------------- DB ---------------------------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="The Girl House API")
api_router = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"


# -------------------------- Auth Utils ----------------------------
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=8),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=False,
                        samesite="lax", max_age=8 * 3600, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=False,
                        samesite="lax", max_age=7 * 24 * 3600, path="/")


def clear_auth_cookies(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="غير مصرح")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="نوع التوكن غير صالح")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="المستخدم غير موجود")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="انتهت صلاحية الجلسة")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="توكن غير صالح")


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="صلاحيات غير كافية")
    return user


# -------------------- Object Storage (Emergent) ---------------------
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = os.environ.get("APP_NAME", "thegirlhouse")
storage_key = None

MIME_TYPES = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
    "gif": "image/gif", "webp": "image/webp",
}


def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    if not EMERGENT_KEY:
        raise RuntimeError("EMERGENT_LLM_KEY not set")
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120,
    )
    if resp.status_code == 403:
        # re-init on auth failure
        global storage_key
        storage_key = None
        key = init_storage()
        resp = requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": content_type},
            data=data, timeout=120,
        )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str) -> tuple:
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60,
    )
    if resp.status_code == 403:
        global storage_key
        storage_key = None
        key = init_storage()
        resp = requests.get(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key}, timeout=60,
        )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# ------------------------- Models ---------------------------------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str


class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name_ar: str
    name_en: str
    slug: str
    concern: bool = False  # True if it's a concern filter (not category)
    icon: Optional[str] = None
    order: int = 0


class CategoryCreate(BaseModel):
    name_ar: str
    name_en: str
    slug: str
    concern: bool = False
    icon: Optional[str] = None
    order: int = 0


class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    name_ar: Optional[str] = ""
    slug: str
    brand: str
    category_slug: str
    concerns: List[str] = []
    short_description: str = ""
    description: str = ""
    benefits: List[str] = []
    how_to_use: str = ""
    ingredients: str = ""
    suitable_for: List[str] = []
    warnings: str = ""
    price: float
    old_price: Optional[float] = None
    stock: int = 0
    images: List[str] = []
    is_active: bool = True
    is_featured: bool = False
    is_best_seller: bool = False
    is_new_arrival: bool = False
    is_offer: bool = False
    is_limited: bool = False
    rating: float = 5.0
    reviews_count: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ProductCreate(BaseModel):
    name: str
    name_ar: Optional[str] = ""
    slug: Optional[str] = None
    brand: str
    category_slug: str
    concerns: List[str] = []
    short_description: str = ""
    description: str = ""
    benefits: List[str] = []
    how_to_use: str = ""
    ingredients: str = ""
    suitable_for: List[str] = []
    warnings: str = ""
    price: float
    old_price: Optional[float] = None
    stock: int = 0
    images: List[str] = []
    is_active: bool = True
    is_featured: bool = False
    is_best_seller: bool = False
    is_new_arrival: bool = False
    is_offer: bool = False
    is_limited: bool = False


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    name_ar: Optional[str] = None
    slug: Optional[str] = None
    brand: Optional[str] = None
    category_slug: Optional[str] = None
    concerns: Optional[List[str]] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    benefits: Optional[List[str]] = None
    how_to_use: Optional[str] = None
    ingredients: Optional[str] = None
    suitable_for: Optional[List[str]] = None
    warnings: Optional[str] = None
    price: Optional[float] = None
    old_price: Optional[float] = None
    stock: Optional[int] = None
    images: Optional[List[str]] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_best_seller: Optional[bool] = None
    is_new_arrival: Optional[bool] = None
    is_offer: Optional[bool] = None
    is_limited: Optional[bool] = None


class OrderItem(BaseModel):
    product_id: str
    name: str
    brand: str
    image: Optional[str] = ""
    price: float
    quantity: int


class OrderCreate(BaseModel):
    customer_name: str
    phone: str
    whatsapp: Optional[str] = ""
    email: Optional[str] = ""
    governorate: str
    city: str
    address: str
    notes: Optional[str] = ""
    payment_method: str  # cod | stripe | whatsapp | vodafone_cash | instapay | paymob | fawry
    items: List[OrderItem]
    coupon_code: Optional[str] = ""


class OrderStatusUpdate(BaseModel):
    order_status: str


class CouponCreate(BaseModel):
    code: str
    discount_type: str = "percent"  # percent | fixed
    value: float
    min_order: float = 0
    max_uses: int = 0  # 0 unlimited
    expires_at: Optional[str] = None
    is_active: bool = True


class Coupon(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    discount_type: str = "percent"
    value: float
    min_order: float = 0
    max_uses: int = 0
    uses: int = 0
    expires_at: Optional[str] = None
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ValidateCouponReq(BaseModel):
    code: str
    subtotal: float


class SettingsUpdate(BaseModel):
    announcement: Optional[str] = None
    whatsapp_number: Optional[str] = None
    instagram: Optional[str] = None
    tiktok: Optional[str] = None
    facebook: Optional[str] = None
    hero_title: Optional[str] = None
    hero_subtitle: Optional[str] = None
    hero_image: Optional[str] = None
    flat_delivery_fee: Optional[float] = None
    delivery_fees: Optional[dict] = None  # governorate -> fee
    payment_methods: Optional[dict] = None  # method -> enabled bool
    free_delivery_threshold: Optional[float] = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


class ReviewCreate(BaseModel):
    product_id: str
    customer_name: str
    rating: int = Field(ge=1, le=5)
    comment: str = ""


class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    customer_name: str
    rating: int
    comment: str = ""
    is_approved: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class TestimonialCreate(BaseModel):
    name: str
    city: str = ""
    rating: int = Field(ge=1, le=5, default=5)
    text: str
    is_active: bool = True
    order: int = 0


class Testimonial(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    city: str = ""
    rating: int = 5
    text: str
    is_active: bool = True
    order: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ------------------------- Slug helper ---------------------------
def slugify(text: str) -> str:
    text = re.sub(r"[^a-zA-Z0-9\u0600-\u06FF\s-]", "", text.lower()).strip()
    text = re.sub(r"[\s_]+", "-", text)
    return text or str(uuid.uuid4())[:8]


# ------------------------- Auth Endpoints -------------------------
@api_router.post("/auth/login")
async def login(body: LoginRequest, response: Response, request: Request):
    email = body.email.lower().strip()
    # Behind ingress/load-balancer there can be multiple proxy IPs. Prefer X-Forwarded-For.
    xff = request.headers.get("x-forwarded-for", "")
    ip = xff.split(",")[0].strip() if xff else (request.client.host if request.client else "unknown")
    identifier = f"{ip}:{email}"

    # Brute force check
    attempts = await db.login_attempts.find_one({"identifier": identifier})
    if attempts and attempts.get("count", 0) >= 5:
        last = datetime.fromisoformat(attempts["last_attempt"])
        if datetime.now(timezone.utc) - last < timedelta(minutes=15):
            raise HTTPException(status_code=429, detail="تم تجاوز عدد محاولات تسجيل الدخول. حاولي بعد 15 دقيقة.")
        else:
            await db.login_attempts.delete_one({"identifier": identifier})

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"last_attempt": datetime.now(timezone.utc).isoformat()}},
            upsert=True,
        )
        raise HTTPException(status_code=401, detail="الإيميل أو كلمة السر غير صحيحة")

    await db.login_attempts.delete_one({"identifier": identifier})

    access = create_access_token(user["id"], user["email"])
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)

    return {"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]}


@api_router.post("/auth/logout")
async def logout(response: Response, user: dict = Depends(get_current_user)):
    clear_auth_cookies(response)
    return {"success": True}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="لا يوجد refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="نوع التوكن غير صالح")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="المستخدم غير موجود")
        access = create_access_token(user["id"], user["email"])
        response.set_cookie("access_token", access, httponly=True, secure=False,
                            samesite="lax", max_age=8 * 3600, path="/")
        return {"success": True}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="توكن غير صالح")


# ------------------------- Categories -----------------------------
@api_router.get("/categories", response_model=List[Category])
async def list_categories():
    cats = await db.categories.find({}, {"_id": 0}).sort("order", 1).to_list(200)
    return cats


@api_router.post("/categories", response_model=Category)
async def create_category(body: CategoryCreate, user: dict = Depends(require_admin)):
    cat = Category(**body.model_dump())
    await db.categories.insert_one(cat.model_dump())
    return cat


@api_router.delete("/categories/{cat_id}")
async def delete_category(cat_id: str, user: dict = Depends(require_admin)):
    res = await db.categories.delete_one({"id": cat_id})
    return {"deleted": res.deleted_count}


# ------------------------- Products -------------------------------
@api_router.get("/products", response_model=List[Product])
async def list_products(
    category: Optional[str] = None,
    concern: Optional[str] = None,
    search: Optional[str] = None,
    sort: str = "newest",
    is_best_seller: Optional[bool] = None,
    is_new_arrival: Optional[bool] = None,
    is_offer: Optional[bool] = None,
    is_featured: Optional[bool] = None,
    limit: int = 200,
    include_inactive: bool = False,
):
    q: dict = {}
    if not include_inactive:
        q["is_active"] = True
    if category:
        q["category_slug"] = category
    if concern:
        q["concerns"] = concern
    if search:
        q["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"name_ar": {"$regex": search, "$options": "i"}},
            {"brand": {"$regex": search, "$options": "i"}},
        ]
    if is_best_seller is not None:
        q["is_best_seller"] = is_best_seller
    if is_new_arrival is not None:
        q["is_new_arrival"] = is_new_arrival
    if is_offer is not None:
        q["is_offer"] = is_offer
    if is_featured is not None:
        q["is_featured"] = is_featured

    sort_map = {
        "newest": [("created_at", -1)],
        "price_asc": [("price", 1)],
        "price_desc": [("price", -1)],
        "best": [("is_best_seller", -1), ("rating", -1)],
        "offers": [("is_offer", -1), ("old_price", -1)],
    }
    sort_spec = sort_map.get(sort, [("created_at", -1)])
    cursor = db.products.find(q, {"_id": 0}).sort(sort_spec).limit(limit)
    prods = await cursor.to_list(limit)
    return prods


@api_router.get("/products/{slug}", response_model=Product)
async def get_product(slug: str):
    prod = await db.products.find_one({"slug": slug, "is_active": True}, {"_id": 0})
    if not prod:
        # Try by id
        prod = await db.products.find_one({"id": slug}, {"_id": 0})
    if not prod:
        raise HTTPException(status_code=404, detail="المنتج غير موجود")
    return prod


@api_router.post("/products", response_model=Product)
async def create_product(body: ProductCreate, user: dict = Depends(require_admin)):
    data = body.model_dump()
    if not data.get("slug"):
        data["slug"] = slugify(data["name"])
    # ensure unique slug
    existing = await db.products.find_one({"slug": data["slug"]})
    if existing:
        data["slug"] = f"{data['slug']}-{str(uuid.uuid4())[:6]}"
    prod = Product(**data)
    await db.products.insert_one(prod.model_dump())
    return prod


@api_router.put("/products/{pid}", response_model=Product)
async def update_product(pid: str, body: ProductUpdate, user: dict = Depends(require_admin)):
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="لا يوجد تعديلات")
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    res = await db.products.update_one({"id": pid}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="المنتج غير موجود")
    prod = await db.products.find_one({"id": pid}, {"_id": 0})
    return prod


@api_router.delete("/products/{pid}")
async def delete_product(pid: str, user: dict = Depends(require_admin)):
    res = await db.products.delete_one({"id": pid})
    return {"deleted": res.deleted_count}


# ------------------------- Orders ---------------------------------
def generate_order_number() -> str:
    return f"TGH-{datetime.now().strftime('%y%m%d')}-{secrets.token_hex(3).upper()}"


@api_router.post("/orders")
async def create_order(body: OrderCreate):
    if not body.items:
        raise HTTPException(status_code=400, detail="السلة فارغة")

    # Recompute prices using current product data
    subtotal = 0.0
    validated_items = []
    for item in body.items:
        prod = await db.products.find_one({"id": item.product_id}, {"_id": 0})
        if not prod or not prod.get("is_active"):
            raise HTTPException(status_code=400, detail=f"منتج غير متوفر: {item.name}")
        qty = max(1, int(item.quantity))
        price = float(prod["price"])
        subtotal += price * qty
        validated_items.append({
            "product_id": prod["id"],
            "name": prod["name"],
            "brand": prod["brand"],
            "image": (prod.get("images") or [""])[0] if prod.get("images") else "",
            "price": price,
            "quantity": qty,
        })

    # Delivery fee
    settings = await db.settings.find_one({"id": "global"}, {"_id": 0}) or {}
    delivery_fees = settings.get("delivery_fees") or {}
    flat = float(settings.get("flat_delivery_fee", 70))
    delivery_fee = float(delivery_fees.get(body.governorate, flat))
    free_thresh = float(settings.get("free_delivery_threshold", 0))
    if free_thresh and subtotal >= free_thresh:
        delivery_fee = 0.0

    # Coupon
    discount = 0.0
    coupon_code = (body.coupon_code or "").strip().upper()
    if coupon_code:
        coupon = await db.coupons.find_one({"code": coupon_code, "is_active": True}, {"_id": 0})
        if coupon and subtotal >= float(coupon.get("min_order", 0)):
            if coupon["discount_type"] == "percent":
                discount = round(subtotal * float(coupon["value"]) / 100, 2)
            else:
                discount = float(coupon["value"])
            if coupon.get("max_uses", 0) and coupon.get("uses", 0) >= coupon["max_uses"]:
                discount = 0.0
                coupon_code = ""
            else:
                await db.coupons.update_one({"code": coupon_code}, {"$inc": {"uses": 1}})

    total = max(0.0, subtotal + delivery_fee - discount)

    order_doc = {
        "id": str(uuid.uuid4()),
        "order_number": generate_order_number(),
        "customer_name": body.customer_name,
        "phone": body.phone,
        "whatsapp": body.whatsapp or body.phone,
        "email": body.email or "",
        "governorate": body.governorate,
        "city": body.city,
        "address": body.address,
        "notes": body.notes or "",
        "payment_method": body.payment_method,
        "payment_status": "paid" if body.payment_method == "stripe" else "pending",
        "order_status": "new",
        "items": validated_items,
        "subtotal": round(subtotal, 2),
        "delivery_fee": round(delivery_fee, 2),
        "discount": round(discount, 2),
        "coupon_code": coupon_code,
        "total": round(total, 2),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.orders.insert_one(order_doc)
    order_doc.pop("_id", None)

    # Decrement stock
    for it in validated_items:
        await db.products.update_one(
            {"id": it["product_id"]},
            {"$inc": {"stock": -it["quantity"]}},
        )

    return order_doc


@api_router.get("/orders")
async def list_orders(
    search: Optional[str] = None,
    order_status: Optional[str] = None,
    limit: int = 200,
    user: dict = Depends(require_admin),
):
    q: dict = {}
    if order_status:
        q["order_status"] = order_status
    if search:
        q["$or"] = [
            {"order_number": {"$regex": search, "$options": "i"}},
            {"customer_name": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
        ]
    cursor = db.orders.find(q, {"_id": 0}).sort("created_at", -1).limit(limit)
    return await cursor.to_list(limit)


@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, user: dict = Depends(require_admin)):
    order = await db.orders.find_one({"$or": [{"id": order_id}, {"order_number": order_id}]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="الطلب غير موجود")
    return order


@api_router.get("/orders/public/{order_number}")
async def get_order_public(order_number: str):
    """Public endpoint for customer to view order after placing it"""
    order = await db.orders.find_one({"order_number": order_number}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="الطلب غير موجود")
    return order


@api_router.patch("/orders/{order_id}/status")
async def update_order_status(order_id: str, body: OrderStatusUpdate, user: dict = Depends(require_admin)):
    allowed = ["new", "confirmed", "preparing", "shipped", "delivered", "cancelled"]
    if body.order_status not in allowed:
        raise HTTPException(status_code=400, detail="حالة غير صالحة")
    res = await db.orders.update_one({"id": order_id}, {"$set": {"order_status": body.order_status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="الطلب غير موجود")
    return {"success": True}


# ------------------------- Coupons --------------------------------
@api_router.get("/coupons", response_model=List[Coupon])
async def list_coupons(user: dict = Depends(require_admin)):
    return await db.coupons.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)


@api_router.post("/coupons", response_model=Coupon)
async def create_coupon(body: CouponCreate, user: dict = Depends(require_admin)):
    data = body.model_dump()
    data["code"] = data["code"].upper().strip()
    coupon = Coupon(**data)
    await db.coupons.insert_one(coupon.model_dump())
    return coupon


@api_router.delete("/coupons/{cid}")
async def delete_coupon(cid: str, user: dict = Depends(require_admin)):
    res = await db.coupons.delete_one({"id": cid})
    return {"deleted": res.deleted_count}


@api_router.post("/coupons/validate")
async def validate_coupon(body: ValidateCouponReq):
    code = body.code.upper().strip()
    coupon = await db.coupons.find_one({"code": code, "is_active": True}, {"_id": 0})
    if not coupon:
        raise HTTPException(status_code=404, detail="كود الخصم غير موجود")
    if body.subtotal < float(coupon.get("min_order", 0)):
        raise HTTPException(status_code=400, detail=f"الحد الأدنى للطلب {coupon['min_order']} ج.م")
    if coupon.get("max_uses", 0) and coupon.get("uses", 0) >= coupon["max_uses"]:
        raise HTTPException(status_code=400, detail="انتهت الكمية المتاحة من كود الخصم")
    if coupon.get("expires_at"):
        try:
            if datetime.fromisoformat(coupon["expires_at"]) < datetime.now(timezone.utc):
                raise HTTPException(status_code=400, detail="انتهت صلاحية الكود")
        except ValueError:
            pass
    if coupon["discount_type"] == "percent":
        discount = round(body.subtotal * float(coupon["value"]) / 100, 2)
    else:
        discount = float(coupon["value"])
    return {"discount": discount, "coupon": coupon}


# ------------------------- Settings -------------------------------
DEFAULT_SETTINGS = {
    "id": "global",
    "announcement": "توصيل داخل مصر | منتجات ألمانية مختارة | الكمية محدودة",
    "whatsapp_number": "201000000000",
    "instagram": "https://instagram.com/thegirlhouse_eg",
    "tiktok": "https://tiktok.com/@thegirlhouse_eg",
    "facebook": "",
    "hero_title": "منتجات عناية ألمانية أصلية وصلت مصر",
    "hero_subtitle": "اختاري منتجات DM الألمانية للعناية بالشعر والبشرة، مع توصيل داخل مصر وتجربة شراء سهلة وآمنة.",
    "hero_image": "https://images.unsplash.com/photo-1622925492533-67508d80cc66",
    "flat_delivery_fee": 70,
    "delivery_fees": {
        "القاهرة": 60, "الجيزة": 60, "الإسكندرية": 75,
        "القليوبية": 70, "الدقهلية": 80, "الشرقية": 80, "المنوفية": 80, "الغربية": 80,
        "البحيرة": 85, "كفر الشيخ": 85, "دمياط": 85, "بورسعيد": 90, "الإسماعيلية": 90,
        "السويس": 90, "شمال سيناء": 110, "جنوب سيناء": 110, "الفيوم": 85, "بني سويف": 85,
        "المنيا": 90, "أسيوط": 95, "سوهاج": 100, "قنا": 105, "الأقصر": 110, "أسوان": 115,
        "البحر الأحمر": 110, "مرسى مطروح": 110, "الوادي الجديد": 120,
    },
    "payment_methods": {
        "cod": True,
        "whatsapp": True,
        "vodafone_cash": True,
        "instapay": True,
        "stripe": False,
        "paymob": False,
        "fawry": False,
    },
    "free_delivery_threshold": 2000,
}


@api_router.get("/settings/public")
async def get_public_settings():
    settings = await db.settings.find_one({"id": "global"}, {"_id": 0})
    if not settings:
        settings = DEFAULT_SETTINGS
    return settings


@api_router.get("/settings")
async def get_settings(user: dict = Depends(require_admin)):
    settings = await db.settings.find_one({"id": "global"}, {"_id": 0})
    if not settings:
        settings = DEFAULT_SETTINGS
    return settings


@api_router.put("/settings")
async def update_settings(body: SettingsUpdate, user: dict = Depends(require_admin)):
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="لا يوجد تعديلات")
    await db.settings.update_one({"id": "global"}, {"$set": update}, upsert=True)
    settings = await db.settings.find_one({"id": "global"}, {"_id": 0})
    return settings


# ------------------------- Stats ----------------------------------
@api_router.get("/stats/dashboard")
async def dashboard_stats(user: dict = Depends(require_admin)):
    total_orders = await db.orders.count_documents({})
    pipeline = [{"$group": {"_id": None, "total": {"$sum": "$total"}}}]
    agg = await db.orders.aggregate(pipeline).to_list(1)
    total_sales = agg[0]["total"] if agg else 0

    # Recent orders
    recent = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).limit(8).to_list(8)

    # Low stock products
    low_stock = await db.products.find(
        {"is_active": True, "stock": {"$lt": 5}}, {"_id": 0}
    ).sort("stock", 1).limit(8).to_list(8)

    # Best sellers (by order count)
    bs_pipeline = [
        {"$unwind": "$items"},
        {"$group": {"_id": "$items.product_id", "count": {"$sum": "$items.quantity"}, "name": {"$first": "$items.name"}}},
        {"$sort": {"count": -1}},
        {"$limit": 5},
    ]
    best_sellers = await db.orders.aggregate(bs_pipeline).to_list(5)

    # Orders per status
    status_pipeline = [{"$group": {"_id": "$order_status", "count": {"$sum": 1}}}]
    status_counts = await db.orders.aggregate(status_pipeline).to_list(10)
    status_map = {s["_id"]: s["count"] for s in status_counts}

    # Orders over last 7 days
    from_date = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    daily = await db.orders.find(
        {"created_at": {"$gte": from_date}}, {"_id": 0, "created_at": 1, "total": 1}
    ).to_list(1000)

    total_products = await db.products.count_documents({"is_active": True})
    return {
        "total_sales": round(total_sales, 2),
        "total_orders": total_orders,
        "total_products": total_products,
        "status_counts": status_map,
        "recent_orders": recent,
        "low_stock": low_stock,
        "best_sellers": best_sellers,
        "daily_orders": daily,
    }


# ------------------------- Stripe ---------------------------------
@api_router.post("/checkout/stripe")
async def create_stripe_session(body: OrderCreate):
    """Placeholder for Stripe Checkout. Returns mock URL.
    To enable, set STRIPE_SECRET_KEY env and implement stripe.checkout.Session.create()."""
    raise HTTPException(status_code=501, detail="الدفع الإلكتروني بالبطاقة غير مفعّل حاليًا. اختاري الدفع عند الاستلام أو عبر واتساب.")


# ------------------------- Paymob / Fawry placeholders -------------
@api_router.post("/checkout/paymob")
async def create_paymob_session(body: OrderCreate):
    raise HTTPException(status_code=501, detail="Paymob غير مفعّل. الرجاء اختيار وسيلة دفع أخرى.")


@api_router.post("/checkout/fawry")
async def create_fawry_session(body: OrderCreate):
    raise HTTPException(status_code=501, detail="فوري غير مفعّل. الرجاء اختيار وسيلة دفع أخرى.")


# ------------------------- File Upload -----------------------------
@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), user: dict = Depends(require_admin)):
    ext = (file.filename.rsplit(".", 1)[-1] if "." in file.filename else "bin").lower()
    if ext not in MIME_TYPES:
        raise HTTPException(status_code=400, detail="نوع الملف غير مدعوم. استخدمي jpg/png/webp.")
    data = await file.read()
    if len(data) > 6 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="حجم الملف أكبر من 6MB")
    content_type = MIME_TYPES[ext]
    path = f"{APP_NAME}/products/{uuid.uuid4()}.{ext}"
    try:
        result = put_object(path, data, content_type)
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail="فشل رفع الصورة. حاولي مجددًا.")
    stored_path = result["path"]
    await db.files.insert_one({
        "id": str(uuid.uuid4()),
        "storage_path": stored_path,
        "original_filename": file.filename,
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    # Return a public URL (served via our backend)
    return {"path": stored_path, "url": f"/api/files/{stored_path}"}


@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    """Public image serving (product images are public)."""
    record = await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    try:
        data, ct = get_object(path)
    except Exception:
        raise HTTPException(status_code=404, detail="الملف غير موجود")
    media_type = (record or {}).get("content_type") or ct
    return Response(content=data, media_type=media_type, headers={"Cache-Control": "public, max-age=604800"})


# ------------------------- Password Change -------------------------
@api_router.post("/auth/change-password")
async def change_password(body: PasswordChangeRequest, user: dict = Depends(get_current_user)):
    if len(body.new_password) < 8:
        raise HTTPException(status_code=400, detail="كلمة السر يجب أن تكون 8 أحرف على الأقل")
    full = await db.users.find_one({"id": user["id"]})
    if not full or not verify_password(body.current_password, full["password_hash"]):
        raise HTTPException(status_code=401, detail="كلمة السر الحالية غير صحيحة")
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"password_hash": hash_password(body.new_password)}},
    )
    return {"success": True}


# ------------------------- Reviews ---------------------------------
@api_router.get("/reviews/{product_id}")
async def list_product_reviews(product_id: str):
    reviews = await db.reviews.find(
        {"product_id": product_id, "is_approved": True}, {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    return reviews


@api_router.post("/reviews")
async def submit_review(body: ReviewCreate):
    prod = await db.products.find_one({"id": body.product_id}, {"_id": 0})
    if not prod:
        raise HTTPException(status_code=404, detail="المنتج غير موجود")
    review = Review(**body.model_dump())
    await db.reviews.insert_one(review.model_dump())
    return {"success": True, "message": "شكرًا، سيظهر التقييم بعد المراجعة."}


@api_router.get("/admin/reviews")
async def admin_list_reviews(user: dict = Depends(require_admin), approved: Optional[bool] = None):
    q = {}
    if approved is not None:
        q["is_approved"] = approved
    reviews = await db.reviews.find(q, {"_id": 0}).sort("created_at", -1).limit(500).to_list(500)
    return reviews


@api_router.patch("/admin/reviews/{rid}/approve")
async def approve_review(rid: str, user: dict = Depends(require_admin)):
    review = await db.reviews.find_one({"id": rid}, {"_id": 0})
    if not review:
        raise HTTPException(status_code=404, detail="التقييم غير موجود")
    await db.reviews.update_one({"id": rid}, {"$set": {"is_approved": True}})
    # Recalculate product rating and review count
    approved = await db.reviews.find(
        {"product_id": review["product_id"], "is_approved": True}, {"_id": 0, "rating": 1}
    ).to_list(1000)
    if approved:
        avg = round(sum(r["rating"] for r in approved) / len(approved), 1)
        await db.products.update_one(
            {"id": review["product_id"]},
            {"$set": {"rating": avg, "reviews_count": len(approved)}},
        )
    return {"success": True}


@api_router.delete("/admin/reviews/{rid}")
async def delete_review(rid: str, user: dict = Depends(require_admin)):
    existing = await db.reviews.find_one({"id": rid}, {"_id": 0})
    res = await db.reviews.delete_one({"id": rid})
    # If an approved review was deleted, recalc product aggregates
    if existing and existing.get("is_approved"):
        approved = await db.reviews.find(
            {"product_id": existing["product_id"], "is_approved": True}, {"_id": 0, "rating": 1}
        ).to_list(1000)
        if approved:
            avg = round(sum(r["rating"] for r in approved) / len(approved), 1)
            await db.products.update_one(
                {"id": existing["product_id"]},
                {"$set": {"rating": avg, "reviews_count": len(approved)}},
            )
        else:
            await db.products.update_one(
                {"id": existing["product_id"]},
                {"$set": {"rating": 5.0, "reviews_count": 0}},
            )
    return {"deleted": res.deleted_count}


# ------------------------- Testimonials ----------------------------
@api_router.get("/testimonials")
async def list_testimonials():
    ts = await db.testimonials.find(
        {"is_active": True}, {"_id": 0}
    ).sort("order", 1).limit(20).to_list(20)
    return ts


@api_router.get("/admin/testimonials")
async def admin_list_testimonials(user: dict = Depends(require_admin)):
    ts = await db.testimonials.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return ts


@api_router.post("/admin/testimonials", response_model=Testimonial)
async def create_testimonial(body: TestimonialCreate, user: dict = Depends(require_admin)):
    t = Testimonial(**body.model_dump())
    await db.testimonials.insert_one(t.model_dump())
    return t


@api_router.put("/admin/testimonials/{tid}")
async def update_testimonial(tid: str, body: TestimonialCreate, user: dict = Depends(require_admin)):
    res = await db.testimonials.update_one({"id": tid}, {"$set": body.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="غير موجود")
    return {"success": True}


@api_router.delete("/admin/testimonials/{tid}")
async def delete_testimonial(tid: str, user: dict = Depends(require_admin)):
    res = await db.testimonials.delete_one({"id": tid})
    return {"deleted": res.deleted_count}


# ------------------------- Root ----------------------------------
@api_router.get("/")
async def root():
    return {"message": "The Girl House API", "status": "running"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


# ------------------------- Startup --------------------------------
SAMPLE_CATEGORIES = [
    {"slug": "haircare", "name_ar": "العناية بالشعر", "name_en": "Haircare", "concern": False, "icon": "sparkles", "order": 1},
    {"slug": "skincare", "name_ar": "العناية بالبشرة", "name_en": "Skincare", "concern": False, "icon": "flower", "order": 2},
    {"slug": "masks", "name_ar": "ماسكات الوجه", "name_en": "Face Masks", "concern": False, "icon": "moon", "order": 3},
    {"slug": "body", "name_ar": "العناية بالجسم", "name_en": "Body Care", "concern": False, "icon": "droplet", "order": 4},
    {"slug": "serums", "name_ar": "سيرومات", "name_en": "Serums", "concern": False, "icon": "zap", "order": 5},
    {"slug": "oils", "name_ar": "زيوت", "name_en": "Oils", "concern": False, "icon": "leaf", "order": 6},
    {"slug": "bundles", "name_ar": "باقات مميزة", "name_en": "Bundles", "concern": False, "icon": "gift", "order": 7},
    # Concerns
    {"slug": "dry-hair", "name_ar": "شعر جاف", "name_en": "Dry Hair", "concern": True, "order": 10},
    {"slug": "damaged-hair", "name_ar": "شعر تالف", "name_en": "Damaged Hair", "concern": True, "order": 11},
    {"slug": "hair-growth", "name_ar": "تطويل الشعر", "name_en": "Hair Growth", "concern": True, "order": 12},
    {"slug": "frizz-control", "name_ar": "التحكم في الهيشان", "name_en": "Frizz Control", "concern": True, "order": 13},
    {"slug": "oily-skin", "name_ar": "بشرة دهنية", "name_en": "Oily Skin", "concern": True, "order": 14},
    {"slug": "dry-skin", "name_ar": "بشرة جافة", "name_en": "Dry Skin", "concern": True, "order": 15},
    {"slug": "sensitive-skin", "name_ar": "بشرة حساسة", "name_en": "Sensitive Skin", "concern": True, "order": 16},
    {"slug": "glow", "name_ar": "إشراقة", "name_en": "Glow", "concern": True, "order": 17},
    {"slug": "hydration", "name_ar": "ترطيب عميق", "name_en": "Hydration", "concern": True, "order": 18},
]

SAMPLE_PRODUCTS = [
    {
        "name": "Balea Professional Hair Repair Mask",
        "name_ar": "ماسك بليا لإصلاح الشعر",
        "slug": "balea-hair-repair-mask",
        "brand": "Balea",
        "category_slug": "haircare",
        "concerns": ["damaged-hair", "dry-hair"],
        "short_description": "ماسك عميق لإصلاح الشعر التالف من بليا الألمانية.",
        "description": "ماسك احترافي من Balea يعيد للشعر حيويته ولمعانه في أسبوعين فقط. بتركيبة غنية بالكيراتين وزيت الأرجان.",
        "benefits": ["يرمم الشعر التالف", "يعطي لمعان فوري", "يقلل التقصف", "مناسب للاستخدام الأسبوعي"],
        "how_to_use": "بعد غسل الشعر بالشامبو، وزعي كمية مناسبة على الأطراف المبللة، اتركيه 5-10 دقائق ثم اشطفيه.",
        "ingredients": "Aqua, Cetearyl Alcohol, Keratin, Argan Oil, Panthenol, Glycerin, Fragrance.",
        "suitable_for": ["كل أنواع الشعر", "شعر مصبوغ", "شعر جاف"],
        "warnings": "للاستخدام الخارجي فقط. تجنبي ملامسة العينين.",
        "price": 420, "old_price": 520, "stock": 30,
        "images": [
            "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800",
            "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800",
        ],
        "is_best_seller": True, "is_offer": True, "is_featured": True, "rating": 4.9, "reviews_count": 128,
    },
    {
        "name": "Balea Vitamin C Glow Serum",
        "name_ar": "سيروم فيتامين سي من بليا",
        "slug": "balea-vitamin-c-serum",
        "brand": "Balea",
        "category_slug": "serums",
        "concerns": ["glow", "dry-skin"],
        "short_description": "سيروم فيتامين سي لإشراقة البشرة وتوحيد اللون.",
        "description": "سيروم مركز بفيتامين C يعطي البشرة إشراقة طبيعية ويقلل من البقع الداكنة تدريجيًا.",
        "benefits": ["يوحد لون البشرة", "يعطي إشراقة", "يدعم إنتاج الكولاجين", "خفيف وسريع الامتصاص"],
        "how_to_use": "صباحًا على بشرة نظيفة، ضعي 3-4 نقط قبل المرطب وواقي الشمس.",
        "ingredients": "Aqua, Ascorbic Acid 10%, Glycerin, Niacinamide, Hyaluronic Acid, Vitamin E.",
        "suitable_for": ["كل أنواع البشرة", "بشرة باهتة"],
        "warnings": "استخدمي واقي الشمس يوميًا.",
        "price": 650, "old_price": None, "stock": 22,
        "images": [
            "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=800",
            "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800",
        ],
        "is_new_arrival": True, "is_featured": True, "rating": 4.8, "reviews_count": 76,
    },
    {
        "name": "Langhaarmädchen Hair Growth Oil",
        "name_ar": "زيت تطويل الشعر لانجهارميدشين",
        "slug": "langhaarmadchen-hair-oil",
        "brand": "Langhaarmädchen",
        "category_slug": "oils",
        "concerns": ["hair-growth", "damaged-hair", "dry-hair"],
        "short_description": "زيت شعر ألماني شهير لدعم النمو وتقوية البصيلات.",
        "description": "خلطة فريدة من زيوت الأرغان، الخروع، والروزماري. يستخدمه آلاف النساء في ألمانيا للحصول على شعر أطول وأقوى.",
        "benefits": ["يدعم نمو الشعر", "يقوي البصيلات", "يقلل التساقط", "يعطي لمعان"],
        "how_to_use": "قبل الاستحمام بساعة، دلكي فروة الرأس بكمية مناسبة بحركات دائرية ثم اشطفي.",
        "ingredients": "Argan Oil, Castor Oil, Rosemary Extract, Biotin, Vitamin E.",
        "suitable_for": ["كل أنواع الشعر", "فروة رأس حساسة"],
        "warnings": "اختبري على الجلد قبل أول استخدام.",
        "price": 890, "old_price": 1050, "stock": 18,
        "images": [
            "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800",
            "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=800",
        ],
        "is_best_seller": True, "is_featured": True, "is_offer": True, "rating": 4.9, "reviews_count": 214,
    },
    {
        "name": "Plex Care Hair Repair Bundle",
        "name_ar": "باقة بليكس كير لإصلاح الشعر",
        "slug": "plex-care-bundle",
        "brand": "Plex Care",
        "category_slug": "bundles",
        "concerns": ["damaged-hair", "frizz-control"],
        "short_description": "شامبو + بلسم + ماسك لروتين كامل لإصلاح الشعر.",
        "description": "باقة متكاملة من Plex Care الألمانية لإصلاح الشعر التالف في 3 خطوات بسيطة.",
        "benefits": ["3 منتجات بسعر موفر", "نتيجة ملحوظة خلال أسبوعين", "تكنولوجيا ربط الشعر"],
        "how_to_use": "استخدمي الشامبو، ثم البلسم، والماسك مرة أسبوعيًا.",
        "ingredients": "انظر كل منتج على حدة.",
        "suitable_for": ["شعر تالف", "شعر مصبوغ", "شعر مفرود كيميائيًا"],
        "warnings": "-",
        "price": 1450, "old_price": 1800, "stock": 12,
        "images": [
            "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800",
            "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800",
        ],
        "is_offer": True, "is_best_seller": True, "rating": 4.8, "reviews_count": 89,
    },
    {
        "name": "DM Hydrating Sheet Mask Set",
        "name_ar": "مجموعة ماسكات ترطيب DM",
        "slug": "dm-hydrating-mask-set",
        "brand": "DM Selection",
        "category_slug": "masks",
        "concerns": ["hydration", "dry-skin"],
        "short_description": "5 ماسكات شيت ترطيب للبشرة الجافة.",
        "description": "مجموعة من 5 ماسكات ورقية فاخرة لترطيب عميق بنكهات مختلفة: ورد، أفوكادو، عسل، رمان، شاي أخضر.",
        "benefits": ["ترطيب فوري", "انتعاش طويل", "مناسب قبل المناسبات"],
        "how_to_use": "على بشرة نظيفة، ضعي الماسك لمدة 15 دقيقة ثم دلكي المتبقي.",
        "ingredients": "Aqua, Hyaluronic Acid, Glycerin, Plant Extracts.",
        "suitable_for": ["كل أنواع البشرة"],
        "warnings": "استخدام خارجي فقط.",
        "price": 280, "old_price": 350, "stock": 45,
        "images": [
            "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800",
            "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800",
        ],
        "is_new_arrival": True, "is_offer": True, "rating": 4.7, "reviews_count": 54,
    },
    {
        "name": "Balea Rose Body Butter",
        "name_ar": "زبدة جسم بالورد من بليا",
        "slug": "balea-rose-body-butter",
        "brand": "Balea",
        "category_slug": "body",
        "concerns": ["hydration", "dry-skin"],
        "short_description": "زبدة جسم غنية برائحة الورد لترطيب 24 ساعة.",
        "description": "زبدة جسم مخملية برائحة الورد الدمشقي، تغذي البشرة وتمنحها نعومة تدوم طويلًا.",
        "benefits": ["ترطيب عميق", "رائحة فاخرة", "تحسّن ملمس البشرة"],
        "how_to_use": "بعد الاستحمام، وزعي كمية مناسبة على الجسم ودلكي.",
        "ingredients": "Shea Butter, Rose Oil, Glycerin, Vitamin E.",
        "suitable_for": ["بشرة جافة", "بشرة عادية"],
        "warnings": "-",
        "price": 340, "old_price": None, "stock": 28,
        "images": [
            "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800",
        ],
        "is_best_seller": True, "rating": 4.8, "reviews_count": 67,
    },
    {
        "name": "Balea Hyaluron Night Cream",
        "name_ar": "كريم ليلي بالهيالورونيك من بليا",
        "slug": "balea-hyaluron-night-cream",
        "brand": "Balea",
        "category_slug": "skincare",
        "concerns": ["hydration", "glow"],
        "short_description": "كريم ليلي بالهيالورونيك للبشرة الناضجة.",
        "description": "كريم ليلي مركز بحمض الهيالورونيك وQ10 لمحاربة علامات التقدم وتجديد خلايا البشرة أثناء النوم.",
        "benefits": ["تجديد ليلي", "ترطيب عميق", "ملء الخطوط الدقيقة"],
        "how_to_use": "كل ليلة على بشرة نظيفة، كآخر خطوة في روتينك.",
        "ingredients": "Hyaluronic Acid, Q10, Shea Butter, Glycerin.",
        "suitable_for": ["كل أنواع البشرة", "بشرة ناضجة"],
        "warnings": "-",
        "price": 580, "old_price": 680, "stock": 20,
        "images": [
            "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=800",
        ],
        "is_offer": True, "is_featured": True, "rating": 4.7, "reviews_count": 43,
    },
    {
        "name": "Alverde Natural Face Cleanser",
        "name_ar": "غسول وجه طبيعي ألفيردي",
        "slug": "alverde-face-cleanser",
        "brand": "Alverde",
        "category_slug": "skincare",
        "concerns": ["sensitive-skin", "oily-skin"],
        "short_description": "غسول وجه لطيف بمكونات طبيعية.",
        "description": "غسول وجه معتمد عضوي من Alverde، مناسب للبشرة الحساسة، ينظف بلطف دون جفاف.",
        "benefits": ["تنظيف لطيف", "لا يجفف البشرة", "مكونات طبيعية"],
        "how_to_use": "صباحًا ومساءً، ضعي كمية على يديك المبللتين ودلكي الوجه ثم اشطفي.",
        "ingredients": "Aqua, Aloe Vera, Glycerin, Chamomile Extract.",
        "suitable_for": ["بشرة حساسة", "بشرة دهنية"],
        "warnings": "-",
        "price": 250, "old_price": None, "stock": 35,
        "images": [
            "https://images.unsplash.com/photo-1556228578-dd539282b964?w=800",
        ],
        "is_new_arrival": True, "rating": 4.6, "reviews_count": 31,
    },
    {
        "name": "Balea Shampoo Repair Intensive",
        "name_ar": "شامبو إصلاح مكثف من بليا",
        "slug": "balea-shampoo-repair",
        "brand": "Balea",
        "category_slug": "haircare",
        "concerns": ["damaged-hair", "frizz-control"],
        "short_description": "شامبو إصلاحي يومي للشعر التالف.",
        "description": "شامبو ناعم ينظف الشعر بلطف ويصلحه من جذوره بتركيبة غنية بالكيراتين.",
        "benefits": ["ينظف بلطف", "يقوي الشعر", "آمن على الألوان"],
        "how_to_use": "يوميًا أو يومًا بعد يوم حسب نوع الشعر.",
        "ingredients": "Aqua, Sodium Laureth Sulfate, Keratin, Panthenol.",
        "suitable_for": ["شعر تالف", "شعر مصبوغ"],
        "warnings": "-",
        "price": 310, "old_price": 380, "stock": 40,
        "images": [
            "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800",
        ],
        "is_offer": True, "rating": 4.6, "reviews_count": 58,
    },
    {
        "name": "Balea Clay Purifying Mask",
        "name_ar": "ماسك طين منقي من بليا",
        "slug": "balea-clay-mask",
        "brand": "Balea",
        "category_slug": "masks",
        "concerns": ["oily-skin"],
        "short_description": "ماسك طين للبشرة الدهنية وتنقية المسام.",
        "description": "ماسك بالطين الأخضر لتنقية البشرة من الشوائب وتضييق المسام.",
        "benefits": ["ينقي البشرة", "يضيق المسام", "يمتص الزيوت الزائدة"],
        "how_to_use": "مرة أسبوعيًا على بشرة نظيفة، اتركيه 10-15 دقيقة واشطفيه.",
        "ingredients": "Kaolin Clay, Aqua, Green Tea Extract, Tea Tree Oil.",
        "suitable_for": ["بشرة دهنية", "بشرة مختلطة"],
        "warnings": "تجنبي منطقة العين.",
        "price": 220, "old_price": None, "stock": 33,
        "images": [
            "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800",
        ],
        "rating": 4.5, "reviews_count": 29,
    },
    {
        "name": "Limited Edition Glow Bundle",
        "name_ar": "باقة الإشراقة الحصرية",
        "slug": "limited-glow-bundle",
        "brand": "The Girl House",
        "category_slug": "bundles",
        "concerns": ["glow", "hydration"],
        "short_description": "باقة حصرية للإشراقة: سيروم + كريم + ماسك.",
        "description": "اختيارنا المميز من منتجات DM للحصول على بشرة مشرقة في 21 يوم.",
        "benefits": ["باقة مختارة بعناية", "توفير 20%", "نتيجة ملحوظة"],
        "how_to_use": "روتين يومي بسيط: غسول، سيروم، مرطب.",
        "ingredients": "-",
        "suitable_for": ["كل أنواع البشرة"],
        "warnings": "-",
        "price": 1290, "old_price": 1600, "stock": 8,
        "images": [
            "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800",
        ],
        "is_limited": True, "is_offer": True, "is_featured": True, "rating": 4.9, "reviews_count": 42,
    },
    {
        "name": "Balea Aqua Hydration Serum",
        "name_ar": "سيروم ترطيب أكوا من بليا",
        "slug": "balea-aqua-serum",
        "brand": "Balea",
        "category_slug": "serums",
        "concerns": ["hydration", "dry-skin"],
        "short_description": "سيروم ترطيب مكثف بالهيالورونيك.",
        "description": "سيروم مائي خفيف بحمض الهيالورونيك الثلاثي لترطيب فوري ومستمر.",
        "benefits": ["ترطيب فوري", "يملأ الخطوط الدقيقة", "خفيف جدًا"],
        "how_to_use": "صباحًا ومساءً قبل المرطب.",
        "ingredients": "Aqua, Hyaluronic Acid, Panthenol, Niacinamide.",
        "suitable_for": ["كل أنواع البشرة"],
        "warnings": "-",
        "price": 480, "old_price": None, "stock": 26,
        "images": [
            "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=800",
        ],
        "is_new_arrival": True, "rating": 4.7, "reviews_count": 38,
    },
]


async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@thegirlhouse.eg").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin@123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Admin user created: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}},
        )
        logger.info("Admin password updated from env")


async def seed_data():
    # Categories
    if await db.categories.count_documents({}) == 0:
        for c in SAMPLE_CATEGORIES:
            cat = Category(**c)
            await db.categories.insert_one(cat.model_dump())
        logger.info(f"Seeded {len(SAMPLE_CATEGORIES)} categories")

    # Products
    if await db.products.count_documents({}) == 0:
        for p in SAMPLE_PRODUCTS:
            prod = Product(**p)
            await db.products.insert_one(prod.model_dump())
        logger.info(f"Seeded {len(SAMPLE_PRODUCTS)} products")

    # Settings
    if not await db.settings.find_one({"id": "global"}):
        await db.settings.insert_one(DEFAULT_SETTINGS.copy())
        logger.info("Seeded default settings")

    # Sample coupon
    if await db.coupons.count_documents({}) == 0:
        sample = Coupon(code="WELCOME10", discount_type="percent", value=10, min_order=300)
        await db.coupons.insert_one(sample.model_dump())
        logger.info("Seeded sample coupon WELCOME10")


async def seed_brand_updates():
    """Update live settings with current brand info if they still have placeholders."""
    existing = await db.settings.find_one({"id": "global"}, {"_id": 0}) or {}
    updates = {}
    if existing.get("whatsapp_number") in (None, "", "201000000000"):
        updates["whatsapp_number"] = DEFAULT_SETTINGS["whatsapp_number"]
    if "thegirlhouse_eg" not in (existing.get("instagram") or ""):
        updates["instagram"] = DEFAULT_SETTINGS["instagram"]
    if "thegirlhouse_eg" not in (existing.get("tiktok") or ""):
        updates["tiktok"] = DEFAULT_SETTINGS["tiktok"]
    if not existing.get("facebook"):
        updates["facebook"] = DEFAULT_SETTINGS["facebook"]
    # Keep the stronger announcement (only update if currently the old generic one)
    if existing.get("announcement") == "توصيل داخل مصر | منتجات ألمانية مختارة | الكمية محدودة":
        updates["announcement"] = DEFAULT_SETTINGS["announcement"]
    if updates:
        await db.settings.update_one({"id": "global"}, {"$set": updates}, upsert=True)
        logger.info(f"Brand settings updated: {list(updates.keys())}")


SAMPLE_TESTIMONIALS = [
    {"name": "نورا م.", "city": "القاهرة", "rating": 5,
     "text": "صراحة المنتج أصلي وطلع أحسن من توقعاتي. الشحن كان سريع والتغليف فاخر ❤️"},
    {"name": "هنا ا.", "city": "الإسكندرية", "rating": 5,
     "text": "كنت بشتري من ألمانيا وكان صعب ومكلف. The Girl House حلت المشكلة وبأسعار أفضل!"},
    {"name": "سلمى ه.", "city": "الجيزة", "rating": 5,
     "text": "سيروم فيتامين C غير شكل بشرتي في 3 أسابيع. توصية 10/10"},
    {"name": "دينا ش.", "city": "المنصورة", "rating": 5,
     "text": "أول تجربة معاهم وكانت روعة. التوصيل وصل أسرع من المتوقع والتغليف بيرفع المعنويات."},
    {"name": "مريم ع.", "city": "طنطا", "rating": 5,
     "text": "بقيت أطلب كل شهر، منتجات بليا الألمانية غيرت روتيني بالكامل."},
]


async def seed_testimonials():
    if await db.testimonials.count_documents({}) == 0:
        for i, t in enumerate(SAMPLE_TESTIMONIALS):
            t_obj = Testimonial(**{**t, "order": i})
            await db.testimonials.insert_one(t_obj.model_dump())
        logger.info(f"Seeded {len(SAMPLE_TESTIMONIALS)} testimonials")


@app.on_event("startup")
async def on_startup():
    try:
        await db.users.create_index("email", unique=True)
        await db.users.create_index("id", unique=True)
        await db.products.create_index("slug", unique=True)
        await db.products.create_index("id", unique=True)
        await db.orders.create_index("order_number", unique=True)
        await db.orders.create_index("id", unique=True)
        await db.categories.create_index("slug", unique=True)
        await db.coupons.create_index("code", unique=True)
        await db.login_attempts.create_index("identifier")
        await db.reviews.create_index("product_id")
        await db.testimonials.create_index("order")
    except Exception as e:
        logger.warning(f"Index creation issue: {e}")
    try:
        init_storage()
        logger.info("Object storage initialized")
    except Exception as e:
        logger.warning(f"Storage init failed (uploads will retry on first use): {e}")
    await seed_admin()
    await seed_data()
    await seed_brand_updates()
    await seed_testimonials()
    logger.info("Startup complete")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
