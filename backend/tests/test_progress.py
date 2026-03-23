import pytest
pytestmark = pytest.mark.asyncio


async def _create_course_with_lesson(client, admin_token):
    h = {"Authorization": f"Bearer {admin_token}"}
    prog = (await client.post("/api/programs", json={"title": "P", "description": ""}, headers=h)).json()
    course = (await client.post("/api/courses", json={"program_id": prog["id"], "title": "C", "description": ""}, headers=h)).json()
    mod = (await client.post("/api/modules", json={"course_id": course["id"], "title": "M", "description": ""}, headers=h)).json()
    lesson = (await client.post("/api/lessons", json={
        "module_id": mod["id"], "title": "L", "type": "theory", "duration_min": 10, "description": ""
    }, headers=h)).json()
    return course, lesson, h


async def test_enroll_in_course(client, student_token, admin_token):
    course, lesson, _ = await _create_course_with_lesson(client, admin_token)
    h = {"Authorization": f"Bearer {student_token}"}
    resp = await client.post("/api/progress/enroll", json={"course_id": course["id"]}, headers=h)
    assert resp.status_code == 201


async def test_enroll_duplicate_returns_200(client, student_token, admin_token):
    course, lesson, _ = await _create_course_with_lesson(client, admin_token)
    h = {"Authorization": f"Bearer {student_token}"}
    await client.post("/api/progress/enroll", json={"course_id": course["id"]}, headers=h)
    resp = await client.post("/api/progress/enroll", json={"course_id": course["id"]}, headers=h)
    assert resp.status_code == 200  # idempotent


async def test_complete_lesson(client, student_token, admin_token):
    course, lesson, _ = await _create_course_with_lesson(client, admin_token)
    h = {"Authorization": f"Bearer {student_token}"}
    await client.post("/api/progress/enroll", json={"course_id": course["id"]}, headers=h)
    resp = await client.post("/api/progress/complete-lesson", json={"lesson_id": lesson["id"]}, headers=h)
    assert resp.status_code == 201


async def test_submit_practice(client, student_token, admin_token):
    course, lesson, ah = await _create_course_with_lesson(client, admin_token)
    block = (await client.post(f"/api/lessons/{lesson['id']}/blocks", json={
        "type": "practice", "sort_order": 0,
        "data": {"options": [{"id": "opt1", "is_correct": True}], "answer_mode": "single"}
    }, headers=ah)).json()
    h = {"Authorization": f"Bearer {student_token}"}
    resp = await client.post("/api/progress/submit-practice", json={
        "lesson_block_id": block["id"],
        "selected_option_ids": ["opt1"]
    }, headers=h)
    assert resp.status_code == 201
    assert resp.json()["is_correct"] is True


async def test_submit_quiz(client, student_token, admin_token):
    course, lesson, ah = await _create_course_with_lesson(client, admin_token)
    block = (await client.post(f"/api/lessons/{lesson['id']}/blocks", json={
        "type": "quiz", "sort_order": 0,
        "data": {
            "passing_score": 70,
            "max_attempts": 3,
            "questions": [{"id": "q1", "points": 10, "correct_option_ids": ["a"], "type": "single_choice"}]
        }
    }, headers=ah)).json()
    h = {"Authorization": f"Bearer {student_token}"}
    resp = await client.post("/api/progress/submit-quiz", json={
        "lesson_block_id": block["id"],
        "score": 10,
        "max_score": 10,
    }, headers=h)
    assert resp.status_code == 201
    assert resp.json()["passed"] is True


async def test_submit_practice_resubmit(client, student_token, admin_token):
    """Re-submitting practice returns 200 and updates the result."""
    course, lesson, ah = await _create_course_with_lesson(client, admin_token)
    block = (await client.post(f"/api/lessons/{lesson['id']}/blocks", json={
        "type": "practice", "sort_order": 0,
        "data": {"options": [{"id": "opt1", "is_correct": True}], "answer_mode": "single"}
    }, headers=ah)).json()
    h = {"Authorization": f"Bearer {student_token}"}
    await client.post("/api/progress/submit-practice", json={
        "lesson_block_id": block["id"], "selected_option_ids": ["opt1"]
    }, headers=h)
    resp = await client.post("/api/progress/submit-practice", json={
        "lesson_block_id": block["id"], "selected_option_ids": []
    }, headers=h)
    assert resp.status_code == 200
    assert resp.json()["is_correct"] is False


async def test_submit_quiz_best_score_preserved(client, student_token, admin_token):
    """Re-submitting quiz with lower score preserves best_score."""
    course, lesson, ah = await _create_course_with_lesson(client, admin_token)
    block = (await client.post(f"/api/lessons/{lesson['id']}/blocks", json={
        "type": "quiz", "sort_order": 0,
        "data": {"passing_score": 70, "max_attempts": 3, "questions": []}
    }, headers=ah)).json()
    h = {"Authorization": f"Bearer {student_token}"}
    await client.post("/api/progress/submit-quiz", json={
        "lesson_block_id": block["id"], "score": 9, "max_score": 10
    }, headers=h)
    resp = await client.post("/api/progress/submit-quiz", json={
        "lesson_block_id": block["id"], "score": 5, "max_score": 10
    }, headers=h)
    assert resp.status_code == 201
    assert resp.json()["best_score"] == 9
    assert resp.json()["score"] == 5
    assert resp.json()["attempts"] == 2
