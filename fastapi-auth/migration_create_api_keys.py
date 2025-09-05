"""
Database migration to create API Keys tables
Run this to add API key functionality to existing VoicePartnerAI database
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# If using PostgreSQL, otherwise adjust for your database
def upgrade():
    """Create API Keys tables."""
    
    # Create api_keys table
    op.create_table(
        'api_keys',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('key_prefix', sa.String(length=8), nullable=False),
        sa.Column('key_hash', sa.String(length=128), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('scopes', sa.JSON(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('workspace_id', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('usage_count', sa.Integer(), nullable=False, default=0),
        sa.Column('rate_limit_per_minute', sa.Integer(), nullable=False, default=60),
        sa.Column('rate_limit_per_hour', sa.Integer(), nullable=False, default=1000),
        sa.Column('rate_limit_per_day', sa.Integer(), nullable=False, default=10000),
        sa.Column('allowed_ips', sa.JSON(), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'])
    )
    
    # Create indexes for api_keys table
    op.create_index('ix_api_keys_id', 'api_keys', ['id'])
    op.create_index('ix_api_keys_key_hash', 'api_keys', ['key_hash'], unique=True)
    op.create_index('ix_api_keys_user_workspace', 'api_keys', ['user_id', 'workspace_id'])
    op.create_index('ix_api_keys_is_active', 'api_keys', ['is_active'])
    
    # Create api_key_usage table
    op.create_table(
        'api_key_usage',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('api_key_id', sa.Integer(), nullable=False),
        sa.Column('endpoint', sa.String(length=200), nullable=False),
        sa.Column('method', sa.String(length=10), nullable=False),
        sa.Column('status_code', sa.Integer(), nullable=False),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.String(length=500), nullable=True),
        sa.Column('response_time_ms', sa.Integer(), nullable=True),
        sa.Column('tokens_used', sa.Integer(), nullable=True),
        sa.Column('credits_consumed', sa.Float(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('error_code', sa.String(length=50), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['api_key_id'], ['api_keys.id'])
    )
    
    # Create indexes for api_key_usage table
    op.create_index('ix_api_key_usage_id', 'api_key_usage', ['id'])
    op.create_index('ix_api_key_usage_api_key_id', 'api_key_usage', ['api_key_id'])
    op.create_index('ix_api_key_usage_timestamp', 'api_key_usage', ['timestamp'])
    op.create_index('ix_api_key_usage_status_code', 'api_key_usage', ['status_code'])

def downgrade():
    """Drop API Keys tables."""
    
    # Drop indexes first
    op.drop_index('ix_api_key_usage_status_code', 'api_key_usage')
    op.drop_index('ix_api_key_usage_timestamp', 'api_key_usage')
    op.drop_index('ix_api_key_usage_api_key_id', 'api_key_usage')
    op.drop_index('ix_api_key_usage_id', 'api_key_usage')
    
    op.drop_index('ix_api_keys_is_active', 'api_keys')
    op.drop_index('ix_api_keys_user_workspace', 'api_keys')
    op.drop_index('ix_api_keys_key_hash', 'api_keys')
    op.drop_index('ix_api_keys_id', 'api_keys')
    
    # Drop tables
    op.drop_table('api_key_usage')
    op.drop_table('api_keys')

# Raw SQL version for manual execution
SQL_UPGRADE = """
-- Create api_keys table
CREATE TABLE api_keys (
    id SERIAL PRIMARY KEY,
    key_prefix VARCHAR(8) NOT NULL,
    key_hash VARCHAR(128) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    scopes JSON NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER NOT NULL DEFAULT 0,
    rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
    rate_limit_per_hour INTEGER NOT NULL DEFAULT 1000,
    rate_limit_per_day INTEGER NOT NULL DEFAULT 10000,
    allowed_ips JSON,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for api_keys
CREATE INDEX ix_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX ix_api_keys_user_workspace ON api_keys(user_id, workspace_id);
CREATE INDEX ix_api_keys_is_active ON api_keys(is_active);

-- Create api_key_usage table
CREATE TABLE api_key_usage (
    id SERIAL PRIMARY KEY,
    api_key_id INTEGER NOT NULL REFERENCES api_keys(id),
    endpoint VARCHAR(200) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    response_time_ms INTEGER,
    tokens_used INTEGER,
    credits_consumed FLOAT,
    error_message TEXT,
    error_code VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for api_key_usage
CREATE INDEX ix_api_key_usage_api_key_id ON api_key_usage(api_key_id);
CREATE INDEX ix_api_key_usage_timestamp ON api_key_usage(timestamp);
CREATE INDEX ix_api_key_usage_status_code ON api_key_usage(status_code);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_api_keys_updated_at 
    BEFORE UPDATE ON api_keys 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
"""

SQL_DOWNGRADE = """
-- Drop triggers and functions
DROP TRIGGER IF EXISTS update_api_keys_updated_at ON api_keys;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes
DROP INDEX IF EXISTS ix_api_key_usage_status_code;
DROP INDEX IF EXISTS ix_api_key_usage_timestamp;
DROP INDEX IF EXISTS ix_api_key_usage_api_key_id;
DROP INDEX IF EXISTS ix_api_keys_is_active;
DROP INDEX IF EXISTS ix_api_keys_user_workspace;
DROP INDEX IF EXISTS ix_api_keys_key_hash;

-- Drop tables
DROP TABLE IF EXISTS api_key_usage;
DROP TABLE IF EXISTS api_keys;
"""

if __name__ == "__main__":
    print("API Keys Migration SQL:")
    print("=" * 50)
    print("UPGRADE:")
    print(SQL_UPGRADE)
    print("\n" + "=" * 50)
    print("DOWNGRADE:")
    print(SQL_DOWNGRADE)