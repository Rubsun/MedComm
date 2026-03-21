import pytest

pytestmark = pytest.mark.asyncio


async def test_list_programs_empty(client):
    resp = await client.get("/api/programs")
    assert resp.status_code == 200
    assert resp.json() == []


async def test_create_program_requires_admin(client, student_token):
    resp = await client.post("/api/programs", json={"title": "Test", "description": ""},
                             headers={"Authorization": f"Bearer {student_token}"})
    assert resp.status_code == 403


async def test_create_program_as_admin(client, admin_token):
    resp = await client.post("/api/programs",
                             json={"title": "Medical Communication", "description": "Learn to communicate"},
                             headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Medical Communication"
    assert data["is_published"] is False


async def test_publish_program(client, admin_token):
    create = await client.post("/api/programs",
                               json={"title": "Prog", "description": ""},
                               headers={"Authorization": f"Bearer {admin_token}"})
    pid = create.json()["id"]
    resp = await client.patch(f"/api/programs/{pid}/publish",
                              headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    assert resp.json()["is_published"] is True


async def test_reorder_programs(client, admin_token):
    h = {"Authorization": f"Bearer {admin_token}"}
    p1 = (await client.post("/api/programs", json={"title": "A", "description": ""}, headers=h)).json()
    p2 = (await client.post("/api/programs", json={"title": "B", "description": ""}, headers=h)).json()
    resp = await client.patch("/api/programs/reorder",
                              json=[{"id": p1["id"], "sort_order": 2}, {"id": p2["id"], "sort_order": 1}],
                              headers=h)
    assert resp.status_code == 200


async def test_delete_program(client, admin_token):
    h = {"Authorization": f"Bearer {admin_token}"}
    p = (await client.post("/api/programs", json={"title": "Del", "description": ""}, headers=h)).json()
    resp = await client.delete(f"/api/programs/{p['id']}", headers=h)
    assert resp.status_code == 204


async def test_list_programs_hides_unpublished(client, admin_token, student_token):
    """Unpublished programs are not visible to students."""
    h = {"Authorization": f"Bearer {admin_token}"}
    await client.post("/api/programs", json={"title": "Draft", "description": ""}, headers=h)
    # Student sees nothing (program is unpublished)
    resp = await client.get("/api/programs", headers={"Authorization": f"Bearer {student_token}"})
    assert resp.status_code == 200
    assert resp.json() == []


async def test_get_program_hides_unpublished(client, admin_token, student_token):
    """Students get 404 for unpublished programs."""
    h = {"Authorization": f"Bearer {admin_token}"}
    p = (await client.post("/api/programs", json={"title": "Draft", "description": ""}, headers=h)).json()
    resp = await client.get(f"/api/programs/{p['id']}", headers={"Authorization": f"Bearer {student_token}"})
    assert resp.status_code == 404


async def test_update_program(client, admin_token):
    h = {"Authorization": f"Bearer {admin_token}"}
    p = (await client.post("/api/programs", json={"title": "Old", "description": ""}, headers=h)).json()
    resp = await client.put(f"/api/programs/{p['id']}", json={"title": "New"}, headers=h)
    assert resp.status_code == 200
    assert resp.json()["title"] == "New"
