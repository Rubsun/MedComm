"""add is_published to modules

Revision ID: 2026c01modpub
Revises: 2026b01slug1
"""
from typing import Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "2026c01modpub"
down_revision: Union[str, None] = "2026b01slug1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # nullable=True для бэкфилла
    op.add_column(
        "modules",
        sa.Column("is_published", sa.Boolean(), nullable=True, server_default=sa.true()),
    )
    # бэкфилл существующих строк (server_default уже сделал это, но на всякий случай)
    op.execute("UPDATE modules SET is_published = TRUE WHERE is_published IS NULL")
    op.alter_column("modules", "is_published", nullable=False, server_default=sa.false())


def downgrade() -> None:
    op.drop_column("modules", "is_published")
