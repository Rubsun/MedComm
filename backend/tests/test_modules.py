import pytest

pytestmark = pytest.mark.asyncio


async def _setup(client, admin_token):
    h = {"Authorization": f"Bearer {admin_token}"}
    prog = (await client.post("/api/programs", json={"title": "P", "description": ""}, headers=h)).json()
    course = (await client.post("/api/courses", json={"program_id": prog["id"], "title": "C", "description": ""}, headers=h)).json()
    return course, h


async def test_create_module(client, admin_token):
    course, h = await _setup(client, admin_token)
    resp = await client.post("/api/modules", json={"course_id": course["id"], "title": "Module 1", "description": ""}, headers=h)
    assert resp.status_code == 201
    assert resp.json()["is_locked"] is False


async def test_lock_module(client, admin_token):
    course, h = await _setup(client, admin_token)
    mod = (await client.post("/api/modules", json={"course_id": course["id"], "title": "M", "description": ""}, headers=h)).json()
    resp = await client.patch(f"/api/modules/{mod['id']}/lock", headers=h)
    assert resp.status_code == 200
    assert resp.json()["is_locked"] is True
    resp2 = await client.patch(f"/api/modules/{mod['id']}/lock", headers=h)
    assert resp2.json()["is_locked"] is False  # toggle back
