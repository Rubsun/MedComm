import pytest

pytestmark = pytest.mark.asyncio


async def _setup(client, admin_token):
    h = {"Authorization": f"Bearer {admin_token}"}
    prog = (await client.post("/api/programs", json={"title": "P", "description": ""}, headers=h)).json()
    course = (await client.post("/api/courses", json={"program_id": prog["id"], "title": "C", "description": ""}, headers=h)).json()
    mod = (await client.post("/api/modules", json={"course_id": course["id"], "title": "M", "description": ""}, headers=h)).json()
    return mod, h


async def test_create_lesson(client, admin_token):
    mod, h = await _setup(client, admin_token)
    resp = await client.post("/api/lessons", json={
        "module_id": mod["id"], "title": "Lesson 1", "description": "", "type": "theory", "duration_min": 30
    }, headers=h)
    assert resp.status_code == 201


async def test_add_block_to_lesson(client, admin_token):
    mod, h = await _setup(client, admin_token)
    lesson = (await client.post("/api/lessons", json={
        "module_id": mod["id"], "title": "L", "description": "", "type": "theory", "duration_min": 10
    }, headers=h)).json()
    resp = await client.post(f"/api/lessons/{lesson['id']}/blocks",
                             json={"type": "text", "sort_order": 0, "data": {"content": "Hello"}},
                             headers=h)
    assert resp.status_code == 201
    assert resp.json()["type"] == "text"


async def test_list_blocks(client, admin_token):
    mod, h = await _setup(client, admin_token)
    lesson = (await client.post("/api/lessons", json={
        "module_id": mod["id"], "title": "L", "description": "", "type": "theory", "duration_min": 10
    }, headers=h)).json()
    await client.post(f"/api/lessons/{lesson['id']}/blocks", json={"type": "text", "sort_order": 0, "data": {}}, headers=h)
    await client.post(f"/api/lessons/{lesson['id']}/blocks", json={"type": "image", "sort_order": 1, "data": {}}, headers=h)
    resp = await client.get(f"/api/lessons/{lesson['id']}/blocks", headers=h)
    assert resp.status_code == 200
    assert len(resp.json()) == 2


async def test_publish_lesson(client, admin_token):
    mod, h = await _setup(client, admin_token)
    lesson = (await client.post("/api/lessons", json={
        "module_id": mod["id"], "title": "L", "description": "", "type": "theory", "duration_min": 10
    }, headers=h)).json()
    resp = await client.patch(f"/api/lessons/{lesson['id']}/publish", headers=h)
    assert resp.json()["is_published"] is True
