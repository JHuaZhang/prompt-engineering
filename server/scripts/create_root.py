#!/usr/bin/env python3
"""CLI script to create the root super-admin user.

Usage:
    cd server
    python -m scripts.create_root --email root@prompt.dev --username root --password <password>

This script directly writes to the database using a sync connection for simplicity.
It does NOT start the FastAPI server.
"""

import argparse
import asyncio
import sys

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.database import async_session_factory
from app.models.user import User


async def create_root(email: str, username: str, password: str) -> None:
    async with async_session_factory() as session:
        # Check if email already exists
        result = await session.execute(select(User).where(User.email == email))
        if result.scalar_one_or_none() is not None:
            print(f"Error: email '{email}' already exists", file=sys.stderr)
            sys.exit(1)

        # Check if username already exists
        result = await session.execute(select(User).where(User.username == username))
        if result.scalar_one_or_none() is not None:
            print(f"Error: username '{username}' already exists", file=sys.stderr)
            sys.exit(1)

        user = User(
            email=email,
            username=username,
            password_hash=hash_password(password),
            role="root",
            status="active",
            created_by="script",
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        print(f"Root user created successfully: id={user.id}, email={user.email}, username={user.username}")


def main():
    parser = argparse.ArgumentParser(description="Create root super-admin user")
    parser.add_argument("--email", required=True, help="Root user email")
    parser.add_argument("--username", required=True, help="Root username")
    parser.add_argument("--password", required=True, help="Root password")
    args = parser.parse_args()

    asyncio.run(create_root(args.email, args.username, args.password))


if __name__ == "__main__":
    main()
