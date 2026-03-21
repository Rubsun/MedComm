import pytest
pytestmark = pytest.mark.asyncio


async def test_list_students_requires_admin(client, student_token):
    resp = await client.get("/api/students", headers={"Authorization": f"Bearer {student_token}"})
    assert resp.status_code == 403


async def test_list_students(client, admin_token, student_token):
    resp = await client.get("/api/students", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    students = resp.json()
    assert len(students) >= 1
    assert all(s["role"] == "student" for s in students)


async def test_search_students(client, admin_token, student_token):
    resp = await client.get("/api/students?search=student@test", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    assert len(resp.json()) == 1


async def test_deactivate_student(client, admin_token, student_token):
    students = (await client.get("/api/students", headers={"Authorization": f"Bearer {admin_token}"})).json()
    student_id = students[0]["id"]
    resp = await client.patch(f"/api/students/{student_id}/deactivate", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    assert resp.json()["is_active"] is False


async def test_student_progress(client, admin_token, student_token):
    students = (await client.get("/api/students", headers={"Authorization": f"Bearer {admin_token}"})).json()
    student_id = students[0]["id"]
    resp = await client.get(f"/api/students/{student_id}/progress", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert "enrollments" in data
    assert "completed_lessons" in data
