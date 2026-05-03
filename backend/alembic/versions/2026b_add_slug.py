"""add slug to programs/courses/modules/lessons

Revision ID: 2026b01slug1
Revises: 2026a04ach1
"""
from typing import Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "2026b01slug1"
down_revision: Union[str, None] = "2026a04ach1"
branch_labels = None
depends_on = None


TABLES = ("programs", "courses", "modules", "lessons")


def upgrade() -> None:
    # 1. Добавляем nullable колонку
    for table in TABLES:
        op.add_column(table, sa.Column("slug", sa.String(length=120), nullable=True))

    # 2. Бэкфилл существующих строк — детерминированно из id
    conn = op.get_bind()
    for table in TABLES:
        prefix = table.rstrip("s")  # programs → program
        conn.execute(
            sa.text(
                f"UPDATE {table} SET slug = :prefix || '-' || id WHERE slug IS NULL"
            ),
            {"prefix": prefix},
        )

    # 3. NOT NULL + UNIQUE + index
    for table in TABLES:
        op.alter_column(table, "slug", nullable=False)
        op.create_unique_constraint(f"uq_{table}_slug", table, ["slug"])
        op.create_index(f"ix_{table}_slug", table, ["slug"])


def downgrade() -> None:
    for table in TABLES:
        op.drop_index(f"ix_{table}_slug", table_name=table)
        op.drop_constraint(f"uq_{table}_slug", table, type_="unique")
        op.drop_column(table, "slug")
