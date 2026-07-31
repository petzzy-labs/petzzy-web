"""Regression tests for PETZZY sponsors, alerts, RBAC, and existing admin operations."""

import os
import re
import time
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL is missing")
BASE_URL = base_url.rstrip("/")
API = f"{BASE_URL}/api"


def _credentials(section: str) -> dict:
    path = Path("/app/memory/test_credentials.md")
    if not path.exists():
        pytest.skip("Missing test_credentials.md")
    content = path.read_text(encoding="utf-8")
    match = re.search(rf"## {re.escape(section)}.*?(?=\n## |\Z)", content, re.S | re.I)
    if not match:
        pytest.skip(f"Missing credential section: {section}")
    block = match.group(0)
    email = re.search(r"(?im)^\s*-\s*\*\*Email:\*\*\s*([^\s]+)", block)
    password = re.search(r"(?im)^\s*-\s*\*\*Password:\*\*\s*([^\s]+)", block)
    if not email or not password:
        pytest.skip(f"Incomplete credentials for: {section}")
    return {"email": email.group(1), "password": password.group(1)}


@pytest.fixture(scope="session")
def client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="session")
def admin_client():
    credentials = _credentials("Admin (Management Portal)")
    session = requests.Session()
    response = session.post(f"{API}/auth/login", json=credentials, timeout=20)
    if response.status_code != 200:
        pytest.fail(f"Admin login failed: {response.status_code} {response.text[:300]}")
    body = response.json()
    assert body["user"]["email"] == credentials["email"]
    assert body["user"]["role"] == "admin"
    assert isinstance(body.get("token"), str) and body["token"]
    session.headers.update({"Authorization": f"Bearer {body['token']}"})
    return session


@pytest.fixture(scope="session")
def regular_client():
    credentials = _credentials("Sample Test User (create via UI /register or below)")
    session = requests.Session()
    response = session.post(f"{API}/auth/login", json=credentials, timeout=20)
    if response.status_code != 200:
        pytest.fail(f"Regular-user login failed: {response.status_code} {response.text[:300]}")
    body = response.json()
    assert body["user"]["role"] == "user"
    session.headers.update({"Authorization": f"Bearer {body['token']}"})
    return session


class TestPublicSponsors:
    """Public sponsor list/detail and not-found behavior."""

    def test_seeded_sponsor_list(self, client):
        # Admin CRUD runs in a parallel pytest worker; retry while its temporary test sponsor exists.
        sponsors = []
        response = None
        for _ in range(25):
            response = client.get(f"{API}/sponsors", timeout=20)
            assert response.status_code == 200
            sponsors = response.json()
            if len(sponsors) == 3:
                break
            time.sleep(0.2)
        assert isinstance(sponsors, list)
        assert len(sponsors) == 3
        assert {s["slug"] for s in sponsors} == {"ather-csr", "tvs-motors", "tataone"}
        assert all(len(s["bin_ids"]) == 3 for s in sponsors)
        assert all("_id" not in s for s in sponsors)

    def test_sponsor_detail_with_bins_and_impact(self, client):
        response = client.get(f"{API}/sponsors/ather-csr", timeout=20)
        assert response.status_code == 200
        body = response.json()
        assert body["sponsor"]["name"] == "Ather CSR"
        assert body["sponsor"]["slug"] == "ather-csr"
        assert [b["bin_id"] for b in body["bins"]] == ["PZ-004", "PZ-005", "PZ-007"]
        assert body["impact"]["bins_funded"] == 3
        assert isinstance(body["impact"]["waste_recycled_kg"], (int, float))
        assert isinstance(body["impact"]["pellets_ready_kg"], (int, float))
        assert isinstance(body["impact"]["animals_fed_total"], int)

    def test_unknown_sponsor_is_404(self, client):
        response = client.get(f"{API}/sponsors/unknown-slug", timeout=20)
        assert response.status_code == 404
        assert response.json()["detail"] == "Sponsor not found"


class TestAdminSponsorCRUD:
    """Admin sponsor create/delete persistence and RBAC."""

    def test_non_admin_cannot_create_sponsor(self, regular_client):
        response = regular_client.post(
            f"{API}/admin/sponsors",
            json={"name": "Denied", "slug": "TEST_denied"},
            timeout=20,
        )
        assert response.status_code == 403
        assert response.json()["detail"] == "Admin only"

    def test_admin_create_then_delete_sponsor(self, admin_client, client):
        slug = "petzzy-manage"
        admin_client.delete(f"{API}/admin/sponsors/{slug}", timeout=20)
        payload = {
            "name": "TEST Petzzy Manage",
            "slug": slug,
            "tagline": "QA sponsor",
            "description": "Created by automated regression testing",
            "website": "https://example.test",
            "bin_ids": ["PZ-001"],
        }
        created = admin_client.post(f"{API}/admin/sponsors", json=payload, timeout=20)
        try:
            assert created.status_code == 200
            created_body = created.json()
            assert created_body["name"] == payload["name"]
            assert created_body["slug"] == slug
            assert created_body["bin_ids"] == ["PZ-001"]
            assert isinstance(created_body["created_at"], str)

            fetched = client.get(f"{API}/sponsors/{slug}", timeout=20)
            assert fetched.status_code == 200
            assert fetched.json()["sponsor"]["name"] == payload["name"]
            assert fetched.json()["impact"]["bins_funded"] == 1
        finally:
            deleted = admin_client.delete(f"{API}/admin/sponsors/{slug}", timeout=20)
        assert deleted.status_code == 200
        assert deleted.json() == {"ok": True}
        after = client.get(f"{API}/sponsors/{slug}", timeout=20)
        assert after.status_code == 404


class TestAdminAlerts:
    """Alert scan response, simulated email recipients, and authorization."""

    def test_non_admin_alert_check_is_forbidden(self, regular_client):
        response = regular_client.post(f"{API}/admin/alerts/check", timeout=20)
        assert response.status_code == 403
        assert response.json()["detail"] == "Admin only"

    def test_admin_alert_check(self, admin_client):
        response = admin_client.post(f"{API}/admin/alerts/check", timeout=40)
        assert response.status_code == 200
        body = response.json()
        assert body["threshold_percent"] == 90.0
        assert set(body["recipients"]) >= {"admin@petzzy.com", "ops@petzzy.com"}
        assert body["email_key_configured"] is False
        assert isinstance(body["alerted"], list)
        assert isinstance(body["skipped_already_alerted"], list)
        for alert in body["alerted"]:
            assert set(alert["recipients"]) == set(body["recipients"])
            assert all(result["status"] == "simulated" for result in alert["results"])


class TestExistingAdminRegression:
    """Existing bins/users tabs' backing APIs, refill, and XLSX export."""

    def test_admin_lists_bins_and_users(self, admin_client):
        bins_response = admin_client.get(f"{API}/admin/bins", timeout=20)
        users_response = admin_client.get(f"{API}/admin/users", timeout=20)
        assert bins_response.status_code == 200
        assert len(bins_response.json()) == 10
        assert {b["bin_id"] for b in bins_response.json()} == {f"PZ-{n:03d}" for n in range(1, 11)}
        assert users_response.status_code == 200
        assert any(u["email"] == "admin@petzzy.com" and u["role"] == "admin" for u in users_response.json())
        assert all("password_hash" not in u and "_id" not in u for u in users_response.json())

    def test_refill_and_verify_persistence(self, admin_client):
        response = admin_client.post(
            f"{API}/admin/bins/PZ-001/refill", json={"pellets_added_kg": 20}, timeout=20
        )
        assert response.status_code == 200
        assert response.json() == {"ok": True, "bin_id": "PZ-001", "pellets_added_kg": 20.0}
        bins = admin_client.get(f"{API}/admin/bins", timeout=20).json()
        bin_doc = next(b for b in bins if b["bin_id"] == "PZ-001")
        assert bin_doc["pellets_kg"] == 20.0
        assert bin_doc["fill_percent"] == 5.0
        assert isinstance(bin_doc["last_refilled"], str)

    def test_exactly_ninety_percent_is_not_over_threshold(self, admin_client):
        """The requirement says alerts fire when fill exceeds 90%, not when equal to 90%."""
        from pymongo import MongoClient

        backend_env = dotenv_values("/app/backend/.env")
        mongo = MongoClient(backend_env["MONGO_URL"])
        collection = mongo[backend_env["DB_NAME"]].bins
        original = collection.find_one({"bin_id": "PZ-010"})
        assert original is not None
        try:
            collection.update_one(
                {"bin_id": "PZ-010"},
                {
                    "$set": {"fill_percent": 90.0, "last_refilled": "9999-01-01T00:00:00+00:00"},
                    "$unset": {"last_alert_at": ""},
                },
            )
            response = admin_client.post(f"{API}/admin/alerts/check", timeout=40)
            assert response.status_code == 200
            alerted_ids = [item["bin_id"] for item in response.json()["alerted"]]
            assert "PZ-010" not in alerted_ids
        finally:
            collection.replace_one({"bin_id": "PZ-010"}, original)
            mongo.close()

    def test_xlsx_export(self, admin_client):
        response = admin_client.get(f"{API}/admin/users/export", timeout=30)
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("application/vnd.openxmlformats")
        assert "petzzy_users.xlsx" in response.headers.get("content-disposition", "")
        assert response.content.startswith(b"PK") and len(response.content) > 1000


class TestAuthSecurityPlaybook:
    """Focused cookie, CORS, and brute-force checks required by the auth playbook."""

    def test_login_cookie_is_httponly_secure(self, client):
        response = client.post(f"{API}/auth/login", json=_credentials("Admin (Management Portal)"), timeout=20)
        assert response.status_code == 200
        cookie = response.headers.get("set-cookie", "").lower()
        assert "access_token=" in cookie
        assert "httponly" in cookie
        assert "secure" in cookie

    def test_seeded_admin_bcrypt_hash_format(self):
        from pymongo import MongoClient

        backend_env = dotenv_values("/app/backend/.env")
        mongo = MongoClient(backend_env["MONGO_URL"])
        try:
            admin = mongo[backend_env["DB_NAME"]].users.find_one({"email": "admin@petzzy.com"})
            assert admin is not None
            assert admin["password_hash"].startswith("$2b$")
        finally:
            mongo.close()

    def test_cors_rejects_unconfigured_origin_for_credentials(self, client):
        response = client.get(f"{API}/", headers={"Origin": "https://untrusted.example"}, timeout=20)
        assert response.status_code == 200
        assert "access-control-allow-origin" not in response.headers

    def test_brute_force_lockout_after_five_failures(self, client):
        payload = {"email": "admin@petzzy.com", "password": "definitely-wrong-password"}
        statuses = [client.post(f"{API}/auth/login", json=payload, timeout=20).status_code for _ in range(6)]
        assert statuses[:5] == [401] * 5
        assert statuses[5] == 429
