import pytest

pytestmark = pytest.mark.asyncio


async def _make_lesson(client, admin_token):
    h = {"Authorization": f"Bearer {admin_token}"}
    prog = (await client.post("/api/programs", json={"title": "P", "description": ""}, headers=h)).json()
    course = (await client.post("/api/courses", json={"program_id": prog["id"], "title": "C", "description": ""}, headers=h)).json()
    mod = (await client.post("/api/modules", json={"course_id": course["id"], "title": "M", "description": ""}, headers=h)).json()
    lesson = (await client.post("/api/lessons", json={
        "module_id": mod["id"], "title": "L", "type": "theory", "duration_min": 5, "description": ""
    }, headers=h)).json()
    return course, lesson, h


async def test_admin_can_create_achievement(client, admin_token):
    h = {"Authorization": f"Bearer {admin_token}"}
    body = {
        "title": "Первый шаг",
        "description": "Завершите первый урок",
        "icon": "trophy",
        "tier": "bronze",
        "metric": "lessons_completed",
        "op": ">=",
        "threshold": 1,
        "xp": 25,
    }
    resp = await client.post("/api/achievements", json=body, headers=h)
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Первый шаг"
    assert data["is_published"] is False


async def test_student_only_sees_published(client, student_token, admin_token):
    h_admin = {"Authorization": f"Bearer {admin_token}"}
    draft = (await client.post("/api/achievements", json={
        "title": "Draft", "metric": "lessons_completed", "threshold": 1
    }, headers=h_admin)).json()
    pub = (await client.post("/api/achievements", json={
        "title": "Pub", "metric": "lessons_completed", "threshold": 1
    }, headers=h_admin)).json()
    await client.patch(f"/api/achievements/{pub['id']}/publish", headers=h_admin)

    # student
    h_student = {"Authorization": f"Bearer {student_token}"}
    resp = await client.get("/api/achievements", headers=h_student)
    titles = [a["title"] for a in resp.json()]
    assert "Pub" in titles
    assert "Draft" not in titles
    # admin sees both
    resp = await client.get("/api/achievements", headers=h_admin)
    titles = [a["title"] for a in resp.json()]
    assert "Pub" in titles and "Draft" in titles


async def test_achievement_unlocks_on_lesson_complete(client, student_token, admin_token):
    course, lesson, ah = await _make_lesson(client, admin_token)
    # publish the lesson + module so student can interact normally
    await client.patch(f"/api/lessons/{lesson['id']}/publish", headers=ah)
    # create an achievement that unlocks at 1 completed lesson
    ach = (await client.post("/api/achievements", json={
        "title": "Первый урок",
        "metric": "lessons_completed",
        "threshold": 1,
        "xp": 25,
    }, headers=ah)).json()
    await client.patch(f"/api/achievements/{ach['id']}/publish", headers=ah)

    h = {"Authorization": f"Bearer {student_token}"}
    await client.post("/api/progress/enroll", json={"course_id": course["id"]}, headers=h)
    resp = await client.post("/api/progress/complete-lesson", json={"lesson_id": lesson["id"]}, headers=h)
    assert resp.status_code == 201
    body = resp.json()
    assert any(a["id"] == ach["id"] for a in body.get("unlocked_achievements", []))

    # /me/achievements должен показать его как unlocked
    me = await client.get("/api/me/achievements", headers=h)
    items = me.json()
    me_one = next(a for a in items if a["id"] == ach["id"])
    assert me_one["unlocked"] is True
    assert me_one["current_value"] >= 1


async def test_streak_starts_at_one(client, student_token, admin_token):
    course, lesson, ah = await _make_lesson(client, admin_token)
    h = {"Authorization": f"Bearer {student_token}"}
    await client.post("/api/progress/enroll", json={"course_id": course["id"]}, headers=h)
    await client.post("/api/progress/complete-lesson", json={"lesson_id": lesson["id"]}, headers=h)
    resp = await client.get("/api/me/streak", headers=h)
    assert resp.status_code == 200
    body = resp.json()
    assert body["current_streak"] == 1
    assert body["longest_streak"] == 1
    assert body["last_active_date"] is not None
