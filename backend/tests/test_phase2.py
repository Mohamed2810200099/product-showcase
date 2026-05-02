"""Phase 2 backend tests: upload, files, reviews, testimonials, change-password, paymob/fawry placeholders."""
import io
import os
import struct
import zlib
import uuid
import pytest
import requests

def _load_url():
    url = os.environ.get("REACT_APP_BACKEND_URL", "").strip()
    if not url:
        # Fallback: read from frontend/.env
        try:
            with open("/app/frontend/.env") as f:
                for line in f:
                    if line.startswith("REACT_APP_BACKEND_URL="):
                        url = line.split("=", 1)[1].strip()
                        break
        except Exception:
            pass
    return url.rstrip("/")


BASE_URL = _load_url()
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@thegirlhouse.eg"
ADMIN_PASSWORD = "Admin@123"


def _make_png_bytes(w=2, h=2) -> bytes:
    """Generate a minimal valid PNG file in memory."""
    def chunk(tag, data):
        return (struct.pack(">I", len(data)) + tag + data
                + struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff))
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)
    raw = b""
    for _ in range(h):
        raw += b"\x00" + b"\xff\x00\x00" * w
    idat = zlib.compress(raw)
    return sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")


# --------------------------- Fixtures ---------------------------
@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    return s


@pytest.fixture(scope="module")
def public_session():
    return requests.Session()


@pytest.fixture(scope="module")
def sample_product_id(public_session):
    r = public_session.get(f"{API}/products?limit=5")
    assert r.status_code == 200
    items = r.json()
    assert items, "No products seeded"
    return items[0]["id"], items[0]["slug"]


# --------------------------- Upload ---------------------------
class TestUpload:
    def test_upload_unauthorized(self, public_session):
        png = _make_png_bytes()
        r = public_session.post(
            f"{API}/upload",
            files={"file": ("test.png", io.BytesIO(png), "image/png")},
        )
        assert r.status_code in (401, 403)

    def test_upload_png_success(self, admin_session):
        png = _make_png_bytes(8, 8)
        r = admin_session.post(
            f"{API}/upload",
            files={"file": ("test.png", io.BytesIO(png), "image/png")},
        )
        assert r.status_code == 200, f"Upload failed: {r.status_code} {r.text}"
        data = r.json()
        assert "path" in data and "url" in data
        assert data["url"].startswith("/api/files/")
        # Verify can be fetched publicly
        full_url = f"{BASE_URL}{data['url']}"
        r2 = requests.get(full_url)
        assert r2.status_code == 200
        assert r2.headers.get("Content-Type", "").startswith("image/")
        assert len(r2.content) > 0
        # Persistence in db.files via re-fetch returning content
        pytest.shared_uploaded_url = data["url"]

    def test_upload_rejects_non_image(self, admin_session):
        r = admin_session.post(
            f"{API}/upload",
            files={"file": ("evil.txt", io.BytesIO(b"hello"), "text/plain")},
        )
        assert r.status_code == 400

    def test_upload_rejects_oversize(self, admin_session):
        big = b"\x00" * (6 * 1024 * 1024 + 10)
        # Wrap as png header so ext check passes -> hits size check
        r = admin_session.post(
            f"{API}/upload",
            files={"file": ("big.png", io.BytesIO(big), "image/png")},
        )
        assert r.status_code == 400


# --------------------------- Files serving ---------------------------
class TestFiles:
    def test_serve_unknown_file(self, public_session):
        r = public_session.get(f"{API}/files/nonexistent/{uuid.uuid4()}.png")
        assert r.status_code == 404


# --------------------------- Change Password ---------------------------
class TestChangePassword:
    def test_short_password_rejected(self, admin_session):
        r = admin_session.post(f"{API}/auth/change-password",
                               json={"current_password": ADMIN_PASSWORD, "new_password": "short1"})
        assert r.status_code == 400

    def test_wrong_current_password(self, admin_session):
        r = admin_session.post(f"{API}/auth/change-password",
                               json={"current_password": "WrongPwd!!", "new_password": "NewPassword@123"})
        assert r.status_code == 401

    def test_change_then_revert(self):
        # Use isolated sessions to avoid affecting module-scoped admin_session
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        if r.status_code != 200:
            pytest.skip(f"Login failed: {r.text}")

        new_pwd = "NewAdmin@2026"
        r = s.post(f"{API}/auth/change-password",
                   json={"current_password": ADMIN_PASSWORD, "new_password": new_pwd})
        assert r.status_code == 200, r.text

        # Old password should now fail
        s2 = requests.Session()
        r = s2.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 401

        # New password works
        s3 = requests.Session()
        r = s3.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": new_pwd})
        assert r.status_code == 200, r.text

        # Revert back so other tests still work
        r = s3.post(f"{API}/auth/change-password",
                    json={"current_password": new_pwd, "new_password": ADMIN_PASSWORD})
        assert r.status_code == 200

        # Verify reverted
        s4 = requests.Session()
        r = s4.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200


# --------------------------- Reviews ---------------------------
class TestReviews:
    def test_submit_review_public(self, public_session, sample_product_id):
        pid, _ = sample_product_id
        r = public_session.post(f"{API}/reviews", json={
            "product_id": pid,
            "customer_name": "TEST_Reviewer",
            "rating": 5,
            "comment": "Great product"
        })
        assert r.status_code == 200
        data = r.json()
        assert data.get("success") is True
        # Save id via admin listing
        TestReviews._created_pid = pid

    def test_submit_review_invalid_product(self, public_session):
        r = public_session.post(f"{API}/reviews", json={
            "product_id": "nonexistent-id-xxx",
            "customer_name": "TEST_Reviewer",
            "rating": 5,
            "comment": "x"
        })
        assert r.status_code == 404

    def test_public_reviews_only_approved(self, public_session, sample_product_id):
        pid, _ = sample_product_id
        r = public_session.get(f"{API}/reviews/{pid}")
        assert r.status_code == 200
        items = r.json()
        # Newly submitted are not approved -> should not appear
        for rv in items:
            assert rv.get("is_approved") is True

    def test_admin_list_reviews(self, admin_session):
        r = admin_session.get(f"{API}/admin/reviews?approved=false")
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert any(rv.get("customer_name") == "TEST_Reviewer" for rv in items)

    def test_approve_review_recalculates_rating(self, admin_session, public_session, sample_product_id):
        pid, slug = sample_product_id
        # Find pending review id
        r = admin_session.get(f"{API}/admin/reviews?approved=false")
        assert r.status_code == 200
        pending = [x for x in r.json() if x["product_id"] == pid and x["customer_name"] == "TEST_Reviewer"]
        assert pending, "No pending review found to approve"
        rid = pending[0]["id"]

        r = admin_session.patch(f"{API}/admin/reviews/{rid}/approve")
        assert r.status_code == 200

        # Now public reviews should include it
        r = public_session.get(f"{API}/reviews/{pid}")
        assert r.status_code == 200
        approved = r.json()
        assert any(rv["id"] == rid for rv in approved)

        # Product rating/reviews_count must reflect approved reviews
        r = public_session.get(f"{API}/products/{slug}")
        assert r.status_code == 200
        prod = r.json()
        # reviews_count should equal number of approved reviews for this product
        assert prod["reviews_count"] == len(approved)
        # rating should equal average of approved ratings (rounded 1 decimal)
        expected = round(sum(rv["rating"] for rv in approved) / len(approved), 1)
        assert abs(prod["rating"] - expected) < 0.05

        # Cleanup the review
        d = admin_session.delete(f"{API}/admin/reviews/{rid}")
        assert d.status_code == 200

    def test_review_rating_validation(self, public_session, sample_product_id):
        pid, _ = sample_product_id
        r = public_session.post(f"{API}/reviews", json={
            "product_id": pid, "customer_name": "TEST_x", "rating": 7, "comment": "bad"
        })
        assert r.status_code == 422


# --------------------------- Testimonials ---------------------------
class TestTestimonials:
    def test_public_testimonials_seeded(self, public_session):
        r = public_session.get(f"{API}/testimonials")
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 5
        for t in items:
            assert t.get("is_active") is True

    def test_admin_testimonials_includes_inactive(self, admin_session):
        # Create an inactive one
        r = admin_session.post(f"{API}/admin/testimonials", json={
            "name": "TEST_Inactive", "city": "X", "rating": 4,
            "text": "test inactive", "is_active": False, "order": 99
        })
        assert r.status_code == 200
        tid = r.json()["id"]

        r = admin_session.get(f"{API}/admin/testimonials")
        assert r.status_code == 200
        items = r.json()
        assert any(t["id"] == tid and t["is_active"] is False for t in items)

        # Public should NOT include it
        r = requests.get(f"{API}/testimonials")
        assert all(t["id"] != tid for t in r.json())

        TestTestimonials._tid = tid

    def test_update_testimonial(self, admin_session):
        tid = TestTestimonials._tid
        r = admin_session.put(f"{API}/admin/testimonials/{tid}", json={
            "name": "TEST_Updated", "city": "Y", "rating": 5,
            "text": "updated text", "is_active": True, "order": 50
        })
        assert r.status_code == 200
        # Verify
        r = admin_session.get(f"{API}/admin/testimonials")
        item = next((x for x in r.json() if x["id"] == tid), None)
        assert item is not None
        assert item["name"] == "TEST_Updated"
        assert item["is_active"] is True

    def test_delete_testimonial(self, admin_session):
        tid = TestTestimonials._tid
        r = admin_session.delete(f"{API}/admin/testimonials/{tid}")
        assert r.status_code == 200
        # Verify gone
        r = admin_session.get(f"{API}/admin/testimonials")
        assert all(x["id"] != tid for x in r.json())

    def test_admin_testimonials_unauthorized(self, public_session):
        r = public_session.get(f"{API}/admin/testimonials")
        assert r.status_code in (401, 403)


# --------------------------- Payment placeholders ---------------------------
class TestPaymentPlaceholders:
    @staticmethod
    def _order_payload(pid):
        return {
            "customer_name": "TEST_x", "phone": "01000000000", "governorate": "القاهرة",
            "city": "القاهرة", "address": "addr", "payment_method": "paymob",
            "items": [{"product_id": pid, "name": "x", "brand": "x", "price": 10, "quantity": 1}],
        }

    def test_paymob_501(self, public_session, sample_product_id):
        pid, _ = sample_product_id
        r = public_session.post(f"{API}/checkout/paymob", json=self._order_payload(pid))
        assert r.status_code == 501

    def test_fawry_501(self, public_session, sample_product_id):
        pid, _ = sample_product_id
        payload = self._order_payload(pid)
        payload["payment_method"] = "fawry"
        r = public_session.post(f"{API}/checkout/fawry", json=payload)
        assert r.status_code == 501

    def test_stripe_501(self, public_session, sample_product_id):
        pid, _ = sample_product_id
        payload = self._order_payload(pid)
        payload["payment_method"] = "stripe"
        r = public_session.post(f"{API}/checkout/stripe", json=payload)
        assert r.status_code == 501


# --------------------------- Existing flows still work ---------------------------
class TestExistingFlows:
    def test_login(self, public_session):
        r = public_session.post(f"{API}/auth/login",
                                json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200

    def test_products_list(self, public_session):
        r = public_session.get(f"{API}/products")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_settings_public(self, public_session):
        r = public_session.get(f"{API}/settings/public")
        assert r.status_code == 200
        assert "whatsapp_number" in r.json()

    def test_stats_dashboard(self, admin_session):
        r = admin_session.get(f"{API}/stats/dashboard")
        assert r.status_code == 200
        data = r.json()
        assert "total_orders" in data and "total_sales" in data

    def test_coupons_validate(self, public_session):
        r = public_session.post(f"{API}/coupons/validate",
                                json={"code": "WELCOME10", "subtotal": 500})
        assert r.status_code == 200
        assert r.json().get("discount", 0) > 0
