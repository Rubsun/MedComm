import pytest

pytestmark = pytest.mark.asyncio


async def _create_program(client, admin_token):
    h = {"Authorization": f"Bearer {admin_token}"}
    return (await client.post("/api/programs", json={"title": "Prog", "description": ""}, headers=h)).json()


async def test_create_course(client, admin_token):
    prog = await _create_program(client, admin_token)
    h = {"Authorization": f"Bearer {admin_token}"}
    resp = await client.post("/api/courses", json={
        "program_id": prog["id"], "title": "Course 1", "description": ""
    }, headers=h)
    assert resp.status_code == 201
    assert resp.json()["program_id"] == prog["id"]


async def test_list_courses_by_program(client, admin_token):
    prog = await _create_program(client, admin_token)
    h = {"Authorization": f"Bearer {admin_token}"}
    await client.post("/api/courses", json={"program_id": prog["id"], "title": "C1", "description": ""}, headers=h)
    await client.post("/api/courses", json={"program_id": prog["id"], "title": "C2", "description": ""}, headers=h)
    resp = await client.get(f"/api/courses?program_id={prog['id']}", headers=h)
    assert resp.status_code == 200
    assert len(resp.json()) == 2


async def test_create_course_requires_admin(client, student_token):
    resp = await client.post("/api/courses", json={"program_id": 1, "title": "C", "description": ""},
                             headers={"Authorization": f"Bearer {student_token}"})
    assert resp.status_code == 403


async def test_publish_course(client, admin_token):
    h = {"Authorization": f"Bearer {admin_token}"}
    prog = (await client.post("/api/programs", json={"title": "P", "description": ""}, headers=h)).json()
    course = (await client.post("/api/courses", json={"program_id": prog["id"], "title": "C", "description": ""}, headers=h)).json()
    resp = await client.patch(f"/api/courses/{course['id']}/publish", headers=h)
    assert resp.status_code == 200
    assert resp.json()["is_published"] is True


async def test_delete_course(client, admin_token):
    h = {"Authorization": f"Bearer {admin_token}"}
    prog = (await client.post("/api/programs", json={"title": "P", "description": ""}, headers=h)).json()
    course = (await client.post("/api/courses", json={"program_id": prog["id"], "title": "C", "description": ""}, headers=h)).json()
    resp = await client.delete(f"/api/courses/{course['id']}", headers=h)
    assert resp.status_code == 204


async def test_list_courses_hides_unpublished(client, admin_token, student_token):
    h = {"Authorization": f"Bearer {admin_token}"}
    prog = (await client.post("/api/programs", json={"title": "P", "description": ""}, headers=h)).json()
    await client.post("/api/courses", json={"program_id": prog["id"], "title": "C", "description": ""}, headers=h)
    resp = await client.get(f"/api/courses?program_id={prog['id']}")
    assert resp.status_code == 200
    assert resp.json() == []
