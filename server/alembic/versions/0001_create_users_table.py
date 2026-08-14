"""create users table

Revision ID: 0001
Revises:
Create Date: 2026-08-13

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("email", sa.String(128), nullable=False),
        sa.Column("username", sa.String(64), nullable=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column(
            "role",
            sa.Enum("root", "admin", "user", name="user_role"),
            nullable=False,
            server_default="user",
        ),
        sa.Column(
            "status",
            sa.Enum("pending_setup", "active", "password_reset", name="user_status"),
            nullable=False,
            server_default="pending_setup",
        ),
        sa.Column("created_by", sa.String(64), nullable=False, server_default="system"),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.current_timestamp(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.current_timestamp(),
        ),
    )
    op.create_index("uk_email", "users", ["email"], unique=True)
    op.create_index("uk_username", "users", ["username"], unique=True)


def downgrade() -> None:
    op.drop_index("uk_username", table_name="users")
    op.drop_index("uk_email", table_name="users")
    op.drop_table("users")
