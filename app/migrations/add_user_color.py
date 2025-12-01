"""Add color field to user

Revision ID: add_user_color
Revises: 
Create Date: 2025-11-29

"""
from alembic import op
import sqlalchemy as sa


def upgrade():
    # Agregar columna color a la tabla user
    op.add_column('user', sa.Column('color', sa.String(7), nullable=True, server_default='#3B82F6'))


def downgrade():
    # Remover columna color de la tabla user
    op.drop_column('user', 'color')
