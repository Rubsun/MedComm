import pytest
import io
pytestmark = pytest.mark.asyncio


async def test_upload_image(client, admin_token):
    h = {"Authorization": f"Bearer {admin_token}"}
    file_content = b"fake image content"
    resp = await client.post(
        "/api/media/upload",
        files={"file": ("test.jpg", io.BytesIO(file_content), "image/jpeg")},
        headers=h,
    )
    assert resp.status_code == 200
    assert "url" in resp.json()
    assert resp.json()["url"].startswith("/media/")


async def test_upload_requires_auth(client):
    file_content = b"fake"
    resp = await client.post(
        "/api/media/upload",
        files={"file": ("test.jpg", io.BytesIO(file_content), "image/jpeg")},
    )
    assert resp.status_code == 401


async def test_upload_rejects_invalid_type(client, admin_token):
    h = {"Authorization": f"Bearer {admin_token}"}
    resp = await client.post(
        "/api/media/upload",
        files={"file": ("test.exe", io.BytesIO(b"bad"), "application/octet-stream")},
        headers=h,
    )
    assert resp.status_code == 400


async def test_upload_requires_admin_not_student(client, student_token):
    resp = await client.post(
        "/api/media/upload",
        files={"file": ("test.jpg", io.BytesIO(b"fake"), "image/jpeg")},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert resp.status_code == 403
