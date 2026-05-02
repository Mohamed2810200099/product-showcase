"""Backend API tests for The Girl House e-commerce app.

Covers: auth, products, categories, orders, coupons, settings, stats, stripe placeholder.
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://dm-girl-house.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@thegirlhouse.eg"
ADMIN_PASSWORD = "Admin@123"


# ----------------------------- Fixtures -----------------------------
@pytest.fixture(scope="module")
def public_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        # If 429 lockout from previous run, wait. Otherwise skip.
        if r.status_code == 429:
            pytest.skip(f"Admin locked out: {r.text}")
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    # Cookies are auto stored in session
    return s


# ============================ Health ===============================
class TestHealth:
    def test_root(self, public_client):
        r = public_client.get(f"{API}/")
        assert r.status_code == 200
        data = r.json()
        assert data.get("status") == "running"


# ============================ Categories ===========================
class TestCategories:
    def test_list_categories_seeded(self, public_client):
        r = public_client.get(f"{API}/categories")
        assert r.status_code == 200
        cats = r.json()
        assert isinstance(cats, list)
        # Spec says 16, code seeds 16 entries (verified)
        assert len(cats) >= 16, f"Expected >=16 categories, got {len(cats)}"
        slugs = [c["slug"] for c in cats]
        assert "haircare" in slugs
        assert "skincare" in slugs


# ============================ Products =============================
class TestProducts:
    def test_list_products(self, public_client):
        r = public_client.get(f"{API}/products")
        assert r.status_code == 200
        prods = r.json()
        assert isinstance(prods, list)
        assert len(prods) >= 12

    def test_filter_category(self, public_client):
        r = public_client.get(f"{API}/products", params={"category": "haircare"})
        assert r.status_code == 200
        prods = r.json()
        assert all(p["category_slug"] == "haircare" for p in prods)
        assert len(prods) >= 1

    def test_filter_concern(self, public_client):
        r = public_client.get(f"{API}/products", params={"concern": "damaged-hair"})
        assert r.status_code == 200
        prods = r.json()
        assert all("damaged-hair" in p["concerns"] for p in prods)

    def test_filter_best_seller(self, public_client):
        r = public_client.get(f"{API}/products", params={"is_best_seller": "true"})
        assert r.status_code == 200
        prods = r.json()
        assert all(p["is_best_seller"] for p in prods)
        assert len(prods) >= 1

    def test_filter_new_arrival(self, public_client):
        r = public_client.get(f"{API}/products", params={"is_new_arrival": "true"})
        assert r.status_code == 200
        assert all(p["is_new_arrival"] for p in r.json())

    def test_filter_offer(self, public_client):
        r = public_client.get(f"{API}/products", params={"is_offer": "true"})
        assert r.status_code == 200
        assert all(p["is_offer"] for p in r.json())

    def test_search(self, public_client):
        r = public_client.get(f"{API}/products", params={"search": "Balea"})
        assert r.status_code == 200
        prods = r.json()
        assert len(prods) >= 1

    def test_sort_price_asc(self, public_client):
        r = public_client.get(f"{API}/products", params={"sort": "price_asc"})
        assert r.status_code == 200
        prods = r.json()
        prices = [p["price"] for p in prods]
        assert prices == sorted(prices)

    def test_get_product_by_slug(self, public_client):
        # Use an actual seeded slug (request mentioned dm-girl-house but seed has these)
        r = public_client.get(f"{API}/products/balea-hair-repair-mask")
        assert r.status_code == 200
        p = r.json()
        assert p["slug"] == "balea-hair-repair-mask"
        assert p["brand"] == "Balea"
        assert "price" in p

    def test_get_product_404(self, public_client):
        r = public_client.get(f"{API}/products/non-existent-slug-xyz")
        assert r.status_code == 404

    def test_get_product_dm_girl_house_request_slug(self, public_client):
        """Spec mentioned 'dm-girl-house' slug but no such product seeded.
        This documents the gap. Should return 404."""
        r = public_client.get(f"{API}/products/dm-girl-house")
        # This will be 404 since not seeded
        assert r.status_code == 404


# ============================ Auth =================================
class TestAuth:
    def test_login_success_sets_cookies(self, public_client):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"
        # Cookies set
        cookies = {c.name: c for c in s.cookies}
        assert "access_token" in cookies
        assert "refresh_token" in cookies
        # httpOnly check via raw header
        set_cookie_hdr = r.headers.get("set-cookie", "")
        assert "HttpOnly" in set_cookie_hdr or "httponly" in set_cookie_hdr.lower()

    def test_me_with_cookies(self, admin_client):
        r = admin_client.get(f"{API}/auth/me")
        assert r.status_code == 200
        u = r.json()
        assert u["email"] == ADMIN_EMAIL
        assert u["role"] == "admin"

    def test_me_without_cookies(self, public_client):
        s = requests.Session()
        r = s.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_login_wrong_password_arabic(self, public_client):
        # Use unique email so brute-force counter doesn't lock the real admin
        r = public_client.post(f"{API}/auth/login", json={"email": "wrong_user_test@example.com", "password": "BadPass!"})
        assert r.status_code == 401
        detail = r.json().get("detail", "")
        # Arabic error message
        assert any("\u0600" <= ch <= "\u06FF" for ch in detail), f"Expected Arabic detail, got: {detail}"

    def test_logout_clears_cookies(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        r2 = s.post(f"{API}/auth/logout")
        assert r2.status_code == 200
        # After logout, /auth/me should fail
        r3 = s.get(f"{API}/auth/me")
        assert r3.status_code == 401


class TestBruteForce:
    """Run last (alphabetical Z) so it doesn't impact other tests."""
    def test_zzz_brute_force_lockout(self):
        # Use a unique email so we don't lock real admin
        unique_email = f"brute_test_{uuid.uuid4().hex[:8]}@example.com"
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        last_status = None
        for i in range(6):
            r = s.post(f"{API}/auth/login", json={"email": unique_email, "password": "wrong"})
            last_status = r.status_code
            if r.status_code == 429:
                break
        assert last_status == 429, f"Expected 429 lockout after 5 attempts, got {last_status}"


# ============================ Coupons ==============================
class TestCouponsPublic:
    def test_validate_welcome10_above_min(self, public_client):
        r = public_client.post(f"{API}/coupons/validate", json={"code": "WELCOME10", "subtotal": 500})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["discount"] == 50.0  # 10% of 500
        assert data["coupon"]["code"] == "WELCOME10"

    def test_validate_welcome10_below_min(self, public_client):
        r = public_client.post(f"{API}/coupons/validate", json={"code": "WELCOME10", "subtotal": 100})
        assert r.status_code == 400

    def test_validate_invalid_code(self, public_client):
        r = public_client.post(f"{API}/coupons/validate", json={"code": "FAKECODE", "subtotal": 500})
        assert r.status_code == 404


# ============================ Orders ===============================
@pytest.fixture(scope="module")
def sample_product(public_client):
    r = public_client.get(f"{API}/products", params={"limit": 5})
    assert r.status_code == 200
    prods = r.json()
    assert prods, "No seeded products available"
    return prods[0]


class TestOrders:
    def test_create_order_cod(self, public_client, sample_product):
        payload = {
            "customer_name": "TEST_Customer",
            "phone": "01000000001",
            "whatsapp": "01000000001",
            "email": "test_customer@example.com",
            "governorate": "القاهرة",
            "city": "Maadi",
            "address": "TEST Address 123",
            "notes": "TEST order",
            "payment_method": "cod",
            "items": [{
                "product_id": sample_product["id"],
                "name": sample_product["name"],
                "brand": sample_product["brand"],
                "image": (sample_product.get("images") or [""])[0],
                "price": sample_product["price"],
                "quantity": 1,
            }],
            "coupon_code": "",
        }
        r = public_client.post(f"{API}/orders", json=payload)
        assert r.status_code == 200, r.text
        order = r.json()
        assert order["order_number"].startswith("TGH-")
        assert order["order_status"] == "new"
        assert order["payment_status"] == "pending"
        # Cairo delivery fee = 60
        assert order["delivery_fee"] == 60
        assert order["subtotal"] == sample_product["price"]
        assert order["total"] == order["subtotal"] + order["delivery_fee"] - order["discount"]

        # Public lookup
        r2 = public_client.get(f"{API}/orders/public/{order['order_number']}")
        assert r2.status_code == 200
        assert r2.json()["id"] == order["id"]

        # Stock decremented
        r3 = public_client.get(f"{API}/products/{sample_product['slug']}")
        assert r3.status_code == 200
        new_stock = r3.json()["stock"]
        assert new_stock == sample_product["stock"] - 1, f"Stock not decremented properly"

        # Save order id for next tests via class attr
        TestOrders.created_order_id = order["id"]
        TestOrders.created_order_number = order["order_number"]

    def test_create_order_with_coupon(self, public_client, sample_product):
        payload = {
            "customer_name": "TEST_CouponUser",
            "phone": "01000000002",
            "governorate": "الجيزة",
            "city": "Giza",
            "address": "TEST 456",
            "payment_method": "whatsapp",
            "items": [{
                "product_id": sample_product["id"],
                "name": sample_product["name"],
                "brand": sample_product["brand"],
                "image": "",
                "price": sample_product["price"],
                "quantity": 2,
            }],
            "coupon_code": "WELCOME10",
        }
        r = public_client.post(f"{API}/orders", json=payload)
        assert r.status_code == 200, r.text
        order = r.json()
        expected_subtotal = sample_product["price"] * 2
        assert order["subtotal"] == expected_subtotal
        assert order["discount"] > 0
        # 10% of subtotal
        assert abs(order["discount"] - round(expected_subtotal * 0.1, 2)) < 0.01

    def test_create_order_empty_cart(self, public_client):
        r = public_client.post(f"{API}/orders", json={
            "customer_name": "X", "phone": "0100", "governorate": "القاهرة",
            "city": "C", "address": "A", "payment_method": "cod", "items": []
        })
        assert r.status_code == 400

    def test_admin_list_orders(self, admin_client):
        r = admin_client.get(f"{API}/orders")
        assert r.status_code == 200
        orders = r.json()
        assert isinstance(orders, list)
        assert len(orders) >= 1

    def test_admin_orders_unauthorized(self, public_client):
        s = requests.Session()
        r = s.get(f"{API}/orders")
        assert r.status_code == 401

    def test_order_status_transitions(self, admin_client):
        oid = getattr(TestOrders, "created_order_id", None)
        if not oid:
            pytest.skip("No order created")
        for st in ["confirmed", "preparing", "shipped", "delivered"]:
            r = admin_client.patch(f"{API}/orders/{oid}/status", json={"order_status": st})
            assert r.status_code == 200, f"Status {st}: {r.text}"
        # Verify final status
        r = admin_client.get(f"{API}/orders/{oid}")
        assert r.status_code == 200
        assert r.json()["order_status"] == "delivered"

    def test_order_status_invalid(self, admin_client):
        oid = getattr(TestOrders, "created_order_id", None)
        if not oid:
            pytest.skip("No order created")
        r = admin_client.patch(f"{API}/orders/{oid}/status", json={"order_status": "bogus"})
        assert r.status_code == 400


# ============================ Stats ================================
class TestStats:
    def test_dashboard_admin(self, admin_client):
        r = admin_client.get(f"{API}/stats/dashboard")
        assert r.status_code == 200
        d = r.json()
        for k in ["total_sales", "total_orders", "total_products", "recent_orders", "low_stock"]:
            assert k in d
        assert d["total_orders"] >= 1

    def test_dashboard_unauthorized(self, public_client):
        s = requests.Session()
        r = s.get(f"{API}/stats/dashboard")
        assert r.status_code == 401


# ============================ Settings =============================
class TestSettings:
    def test_get_settings_admin(self, admin_client):
        r = admin_client.get(f"{API}/settings")
        assert r.status_code == 200
        s = r.json()
        assert "delivery_fees" in s
        assert "payment_methods" in s

    def test_get_settings_unauth(self, public_client):
        s = requests.Session()
        r = s.get(f"{API}/settings")
        assert r.status_code == 401

    def test_update_settings(self, admin_client):
        new_announcement = f"TEST_announcement_{uuid.uuid4().hex[:6]}"
        r = admin_client.put(f"{API}/settings", json={"announcement": new_announcement})
        assert r.status_code == 200
        assert r.json()["announcement"] == new_announcement
        # Verify persisted
        r2 = admin_client.get(f"{API}/settings")
        assert r2.json()["announcement"] == new_announcement


# ============================ Admin Coupons ========================
class TestCouponsAdmin:
    created_coupon_id = None

    def test_create_coupon(self, admin_client):
        code = f"TEST{uuid.uuid4().hex[:6].upper()}"
        r = admin_client.post(f"{API}/coupons", json={
            "code": code, "discount_type": "fixed", "value": 50, "min_order": 200, "is_active": True
        })
        assert r.status_code == 200, r.text
        c = r.json()
        assert c["code"] == code
        TestCouponsAdmin.created_coupon_id = c["id"]
        TestCouponsAdmin.created_code = code

    def test_validate_created_coupon(self, public_client):
        if not TestCouponsAdmin.created_coupon_id:
            pytest.skip("Coupon not created")
        r = public_client.post(f"{API}/coupons/validate", json={
            "code": TestCouponsAdmin.created_code, "subtotal": 500
        })
        assert r.status_code == 200
        assert r.json()["discount"] == 50

    def test_delete_coupon(self, admin_client):
        if not TestCouponsAdmin.created_coupon_id:
            pytest.skip("Coupon not created")
        r = admin_client.delete(f"{API}/coupons/{TestCouponsAdmin.created_coupon_id}")
        assert r.status_code == 200
        assert r.json()["deleted"] == 1

    def test_coupons_unauth(self, public_client):
        s = requests.Session()
        r = s.get(f"{API}/coupons")
        assert r.status_code == 401


# ============================ Admin Products =======================
class TestProductsAdmin:
    created_id = None

    def test_create_product(self, admin_client):
        payload = {
            "name": f"TEST Product {uuid.uuid4().hex[:6]}",
            "name_ar": "اختبار",
            "brand": "TEST",
            "category_slug": "haircare",
            "price": 199.99,
            "stock": 10,
            "short_description": "test",
            "description": "test desc",
            "images": ["https://example.com/img.jpg"],
        }
        r = admin_client.post(f"{API}/products", json=payload)
        assert r.status_code == 200, r.text
        p = r.json()
        assert p["name"] == payload["name"]
        assert p["slug"]  # auto-generated
        assert p["price"] == 199.99
        TestProductsAdmin.created_id = p["id"]
        TestProductsAdmin.created_slug = p["slug"]

    def test_update_product(self, admin_client):
        if not TestProductsAdmin.created_id:
            pytest.skip("Product not created")
        r = admin_client.put(f"{API}/products/{TestProductsAdmin.created_id}", json={"price": 249.99, "stock": 20})
        assert r.status_code == 200
        assert r.json()["price"] == 249.99
        assert r.json()["stock"] == 20

    def test_delete_product(self, admin_client):
        if not TestProductsAdmin.created_id:
            pytest.skip("Product not created")
        r = admin_client.delete(f"{API}/products/{TestProductsAdmin.created_id}")
        assert r.status_code == 200
        assert r.json()["deleted"] == 1
        # Verify gone
        r2 = admin_client.get(f"{API}/products/{TestProductsAdmin.created_slug}")
        assert r2.status_code == 404

    def test_create_product_unauth(self, public_client):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        r = s.post(f"{API}/products", json={"name": "X", "brand": "Y", "category_slug": "haircare", "price": 1})
        assert r.status_code == 401


# ============================ Stripe Placeholder ===================
class TestStripePlaceholder:
    def test_stripe_returns_501(self, public_client, sample_product):
        payload = {
            "customer_name": "X", "phone": "0100", "governorate": "القاهرة",
            "city": "C", "address": "A", "payment_method": "stripe",
            "items": [{
                "product_id": sample_product["id"],
                "name": sample_product["name"],
                "brand": sample_product["brand"],
                "image": "",
                "price": sample_product["price"],
                "quantity": 1,
            }],
        }
        r = public_client.post(f"{API}/checkout/stripe", json=payload)
        assert r.status_code == 501
