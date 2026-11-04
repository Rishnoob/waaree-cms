"""Admin commands.

uv run python -m app.cli create-superadmin --email you@company.com --name "Your Name"   (asks for a password)
uv run python -m app.cli seed-dev          (LOCAL ONLY: one test account per default role)
"""

import argparse
import getpass
import sys

from sqlalchemy import select

from app.core.config import get_settings
from app.core.db import get_db
from app.core.security import hash_password
from app.modules.auth.models import Role, User
from app.modules.auth.service import sync_permissions

DEV_ACCOUNTS = [
    ("superadmin@waaree.test", "Super Admin (test)", "Super Admin"),
    ("admin@waaree.test", "Admin (test)", "Admin"),
    ("editor@waaree.test", "Editor (test)", "Editor"),
    ("approver@waaree.test", "Approver (test)", "Approver"),
]


def _upsert_user(db, email: str, name: str, password: str, role_name: str) -> str:
    role = db.scalar(select(Role).where(Role.name == role_name))
    if role is None:
        sys.exit(f"Role '{role_name}' not found. Run: uv run alembic upgrade head")
    user = db.scalar(select(User).where(User.email == email.lower()))
    if user:
        return f"exists   {email}"
    db.add(User(email=email.lower(), full_name=name, password_hash=hash_password(password), roles=[role]))
    return f"created  {email}  ({role_name})"


def create_superadmin(email: str, name: str) -> None:
    password = getpass.getpass("Password (min 12 characters): ")
    if len(password) < 12:
        sys.exit("Password must be at least 12 characters.")
    if password != getpass.getpass("Repeat password: "):
        sys.exit("Passwords don't match.")
    db = next(get_db())
    try:
        print(_upsert_user(db, email, name, password, "Super Admin"))
        db.commit()
    finally:
        db.close()


def seed_dev() -> None:
    settings = get_settings()
    if settings.environment != "local":
        sys.exit("seed-dev only runs when ENVIRONMENT=local.")
    if not settings.dev_seed_password:
        sys.exit("Set DEV_SEED_PASSWORD in .env first.")
    db = next(get_db())
    try:
        sync_permissions(db)  # so default roles have their default permissions
        for email, name, role in DEV_ACCOUNTS:
            print(_upsert_user(db, email, name, settings.dev_seed_password.get_secret_value(), role))
        db.commit()
    finally:
        db.close()
    print("Password for all test accounts: DEV_SEED_PASSWORD in waaree-apis/.env")


def main() -> None:
    parser = argparse.ArgumentParser(prog="python -m app.cli")
    sub = parser.add_subparsers(dest="command", required=True)
    p = sub.add_parser("create-superadmin", help="Create a Super Admin user")
    p.add_argument("--email", required=True)
    p.add_argument("--name", required=True)
    sub.add_parser("seed-dev", help="Local only: create one test account per default role")
    args = parser.parse_args()
    if args.command == "create-superadmin":
        create_superadmin(args.email, args.name)
    else:
        seed_dev()


if __name__ == "__main__":
    main()
