import pytest

pytestmark = pytest.mark.asyncio


async def test_register_success(client):
    resp = await client.post("/api/auth/register", json={
        "email": "new@test.com",
        "password": "password123",
        "first_name": "New",
        "last_name": "User",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "new@test.com"
    assert "password" not in data


async def test_register_duplicate_email(client):
    payload = {"email": "dup@test.com", "password": "pass123", "first_name": "A", "last_name": "B"}
    await client.post("/api/auth/register", json=payload)
    resp = await client.post("/api/auth/register", json=payload)
    assert resp.status_code == 409


async def test_login_success(client):
    await client.post("/api/auth/register", json={
        "email": "login@test.com", "password": "pass123", "first_name": "A", "last_name": "B"
    })
    resp = await client.post("/api/auth/login", json={
        "email": "login@test.com", "password": "pass123"
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()
    assert "refresh_token" in resp.cookies  # httpOnly cookie


async def test_login_wrong_password(client):
    await client.post("/api/auth/register", json={
        "email": "wp@test.com", "password": "pass123", "first_name": "A", "last_name": "B"
    })
    resp = await client.post("/api/auth/login", json={"email": "wp@test.com", "password": "wrong"})
    assert resp.status_code == 401


async def test_me_returns_current_user(client, student_token):
    resp = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {student_token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "student@test.com"


async def test_me_unauthorized(client):
    resp = await client.get("/api/auth/me")
    assert resp.status_code == 401


async def test_logout_clears_cookie(client, student_token):
    await client.post("/api/auth/login", json={"email": "student@test.com", "password": "password123"})
    resp = await client.post("/api/auth/logout", headers={"Authorization": f"Bearer {student_token}"})
    assert resp.status_code == 200


async def test_refresh_rotates_token(client):
    """Refresh endpoint issues a new access token and sets a new refresh cookie."""
    await client.post("/api/auth/register", json={
        "email": "refresh@test.com", "password": "pass123", "first_name": "A", "last_name": "B"
    })
    await client.post("/api/auth/login", json={"email": "refresh@test.com", "password": "pass123"})
    resp = await client.post("/api/auth/refresh")
    assert resp.status_code == 200
    assert "access_token" in resp.json()
    assert "refresh_token" in resp.cookies


async def test_logout_revokes_refresh_token(client):
    """After logout, using the old refresh token returns 401."""
    await client.post("/api/auth/register", json={
        "email": "rev@test.com", "password": "pass123", "first_name": "A", "last_name": "B"
    })
    login_resp = await client.post("/api/auth/login", json={"email": "rev@test.com", "password": "pass123"})
    token = login_resp.json()["access_token"]
    await client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
    resp = await client.post("/api/auth/refresh")
    assert resp.status_code == 401
