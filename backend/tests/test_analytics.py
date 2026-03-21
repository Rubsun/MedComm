import pytest
pytestmark = pytest.mark.asyncio


async def test_analytics_requires_admin(client, student_token):
    resp = await client.get("/api/analytics/overview", headers={"Authorization": f"Bearer {student_token}"})
    assert resp.status_code == 403


async def test_overview_returns_stats(client, admin_token):
    resp = await client.get("/api/analytics/overview", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert "total_students" in data
    assert "enrollments_per_course" in data


async def test_completion_rates(client, admin_token):
    resp = await client.get("/api/analytics/completion", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


async def test_dropoff(client, admin_token):
    resp = await client.get("/api/analytics/dropoff", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
