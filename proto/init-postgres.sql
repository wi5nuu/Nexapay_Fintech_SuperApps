-- ============================================================
-- NexaPay PostgreSQL Database Initialization
-- Creates all databases required by microservices
-- ============================================================

-- Admin user setup
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'nexapay') THEN
    CREATE ROLE nexapay WITH LOGIN PASSWORD 'nexapay_pass' SUPERUSER;
  END IF;
END
$$;

-- Auth Service Database
SELECT 'CREATE DATABASE nexapay_auth OWNER nexapay ENCODING UTF8 LC_COLLATE en_US.UTF-8 LC_CTYPE en_US.UTF-8'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'nexapay_auth')\gexec

-- Users & KYC Service Database
SELECT 'CREATE DATABASE nexapay_users OWNER nexapay ENCODING UTF8 LC_COLLATE en_US.UTF-8 LC_CTYPE en_US.UTF-8'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'nexapay_users')\gexec

-- Wallet Service Database
SELECT 'CREATE DATABASE nexapay_wallets OWNER nexapay ENCODING UTF8 LC_COLLATE en_US.UTF-8 LC_CTYPE en_US.UTF-8'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'nexapay_wallets')\gexec

-- Loan Service Database
SELECT 'CREATE DATABASE nexapay_loans OWNER nexapay ENCODING UTF8 LC_COLLATE en_US.UTF-8 LC_CTYPE en_US.UTF-8'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'nexapay_loans')\gexec

-- Connect to nexapay_auth and create schemas
\c nexapay_auth;

CREATE SCHEMA IF NOT EXISTS auth;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Connect to nexapay_users and create schemas
\c nexapay_users;

CREATE SCHEMA IF NOT EXISTS users;
CREATE SCHEMA IF NOT EXISTS kyc;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Connect to nexapay_wallets and create schemas
\c nexapay_wallets;

CREATE SCHEMA IF NOT EXISTS wallet;
CREATE SCHEMA IF NOT EXISTS transactions;
CREATE SCHEMA IF NOT EXISTS payments;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Connect to nexapay_loans and create schemas
\c nexapay_loans;

CREATE SCHEMA IF NOT EXISTS loans;
CREATE SCHEMA IF NOT EXISTS credit;
CREATE SCHEMA IF NOT EXISTS repayments;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE nexapay_auth TO nexapay;
GRANT ALL PRIVILEGES ON DATABASE nexapay_users TO nexapay;
GRANT ALL PRIVILEGES ON DATABASE nexapay_wallets TO nexapay;
GRANT ALL PRIVILEGES ON DATABASE nexapay_loans TO nexapay;
