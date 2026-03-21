import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool

from backend.main import app
from backend.database import Base
from backend.dependencies import get_db
from backend.config import settings

TEST_DATABASE_URL = settings.test_database_url or settings.database_url.replace("/medcomm", "/medcomm_test")


@pytest.fixture(scope="session")
def test_engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    yield engine


@pytest.fixture(scope="session")
def test_session_factory(test_engine):
    return async_sessionmaker(test_engine, expire_on_commit=False)


@pytest_asyncio.fixture(loop_scope="session", scope="session", autouse=True)
async def setup_test_db(test_engine):
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


@pytest_asyncio.fixture(autouse=True)
async def clean_tables():
    yield
    # Use a fresh engine for cleanup to avoid event loop conflicts
    cleanup_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with cleanup_engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            await conn.execute(table.delete())
    await cleanup_engine.dispose()


_override_engine = create_async_engine(TEST_DATABASE_URL, echo=False, poolclass=NullPool)
TestSessionLocal = async_sessionmaker(_override_engine, expire_on_commit=False)


async def override_get_db():
    async with TestSessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest_asyncio.fixture
async def student_token(client):
    await client.post("/api/auth/register", json={
        "email": "student@test.com",
        "password": "password123",
        "first_name": "Test",
        "last_name": "Student",
    })
    resp = await client.post("/api/auth/login", json={
        "email": "student@test.com",
        "password": "password123",
    })
    return resp.json()["access_token"]


@pytest_asyncio.fixture
async def admin_token(client):
    from backend.models.user import User
    from backend.services.auth_service import hash_password
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as session:
        admin = User(
            email="admin@test.com",
            password_hash=hash_password("admin123"),
            role="admin",
            first_name="Admin",
            last_name="Test",
        )
        session.add(admin)
        await session.commit()
    await engine.dispose()
    resp = await client.post("/api/auth/login", json={
        "email": "admin@test.com",
        "password": "admin123",
    })
    return resp.json()["access_token"]
