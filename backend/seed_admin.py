#!/usr/bin/env python
"""Usage: python seed_admin.py"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from backend.config import settings
from backend.models.user import User
from backend.services.auth_service import hash_password


async def seed():
    email = input("Admin email: ")
    import getpass
    password = getpass.getpass("Admin password: ")
    first_name = input("First name: ")
    last_name = input("Last name: ")

    engine = create_async_engine(settings.database_url)
    Session = async_sessionmaker(engine, expire_on_commit=False)
    async with Session() as session:
        admin = User(
            email=email,
            password_hash=hash_password(password),
            role="admin",
            first_name=first_name,
            last_name=last_name,
        )
        session.add(admin)
        await session.commit()
    print(f"Admin '{email}' created successfully.")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
