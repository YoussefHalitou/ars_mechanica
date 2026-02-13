# Self-Contained Version - Changes from Supabase Version

This document outlines the changes made to create a self-contained version of the LIS White-Label System that doesn't require external Supabase.

## 🔧 Major Changes

### 1. Database Configuration

**Before (Supabase):**
```env
SUPABASE_URL=postgresql+asyncpg://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**After (Local PostgreSQL):**
```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/lis_dev
# No SUPABASE_ANON_KEY needed
```

### 2. Docker Compose Setup

**Added:**
- PostgreSQL service running in Docker container
- Health checks for database and Redis
- Volume mounts for persistent data
- Initialization script for database schema

**Modified services:**
- `backend`: Now depends on local postgres instead of external
- `backend-prod`: Same for production

### 3. Database Initialization

**Before:** Tables were expected to exist in Supabase

**After:** Tables are created automatically on first startup

- `init.sql`: Complete database schema script
- `backend/main.py`: Calls `init_db()` on startup
- Demo data inserted automatically if tables are empty

### 4. Environment Variables

**Removed:**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

**Added:**
- `DATABASE_URL` (points to local PostgreSQL)
- Local PostgreSQL credentials (POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB)

## 📁 New Files

1. **`init.sql`** - Complete database initialization script
   - Creates all tables matching original DDL
   - Sets up foreign key constraints
   - Creates indexes for performance
   - Inserts demo data if tables are empty

2. **Updated `.env.template`** - Removed Supabase, added local DB config

3. **Updated `docker-compose.yml`** - Added PostgreSQL service

## 🔧 Modified Files

1. **`backend/core/database.py`**
   - Changed database URL configuration
   - Removed Supabase-specific connection logic
   - Added `init_db()` function for table creation

2. **`backend/main.py`**
   - Added call to `init_db()` on startup
   - Ensures database is ready before starting

3. **`Makefile`**
   - Removed Supabase-specific commands
   - Added database management commands:
     - `make init-db` - Initialize database
     - `make reset-db` - Reset database
   - Simplified `make seed` command

4. **`README.md`**
   - Removed Supabase setup instructions
   - Added local PostgreSQL setup
   - Simplified quick start guide
   - Added "What's Different" section

5. **`.env.template`**
   - Removed Supabase variables
   - Added local PostgreSQL configuration

## 🚀 Usage Differences

### Starting the Application

**Before:**
```bash
# Required Supabase setup first
make dev
```

**After:**
```bash
# Just run - everything is self-contained!
make dev
```

### Database Management

**Before:**
```bash
# Had to use Supabase dashboard or CLI
```

**After:**
```bash
# Local database management
make reset-db   # Reset database
make init-db    # Initialize tables
make migrate    # Run migrations
make seed       # Seed demo data
```

### Accessing Database

**Before:**
- Connect to Supabase via web dashboard
- Use Supabase CLI

**After:**
```bash
# Connect to local PostgreSQL
docker exec -it lis-white-postgres-1 psql -U postgres -d lis_dev

# Or on port 5432 locally
psql -h localhost -U postgres -d lis_dev
```

## ✅ What's Preserved

### 1. API Compatibility
- All API endpoints remain exactly the same
- Same request/response formats
- Same authentication (none required for this version)

### 2. Database Schema
- All tables match original DDL exactly
- Same column names, types, constraints
- Same foreign key relationships

### 3. Business Logic
- Nachkalkulation calculations unchanged
- Time pair generation identical
- Margin calculations preserved

### 4. Multi-tenant Support
- YAML-based client configs still work
- Module enable/disable per client
- White-label branding preserved

### 5. Streamlit Frontend
- All pages remain the same
- German localization preserved
- CSV import/export functionality intact

## 📊 Data Persistence

**Before:** Data stored in Supabase (cloud)
**After:** Data stored in Docker volume (`postgres_data`)

**Backup/Restore:**
```bash
# Backup database
docker exec lis-white-postgres-1 pg_dump -U postgres lis_dev > backup.sql

# Restore database
docker exec -i lis-white-postgres-1 psql -U postgres lis_dev < backup.sql
```

## 🔍 Testing the Self-Contained Version

1. **Start the system:**
   ```bash
   cd /mnt/okcomputer/output/lis-white
   make dev
   ```

2. **Verify database is running:**
   ```bash
   docker ps  # Should show postgres container running
   ```

3. **Check API endpoints:**
   - Open http://localhost:8000/docs
   - Test a few endpoints

4. **Verify frontend:**
   - Open http://localhost:8501
   - Navigate through pages

5. **Check database has data:**
   ```bash
   docker exec lis-white-postgres-1 psql -U postgres -d lis_dev -c "SELECT count(*) FROM t_services;"
   ```

## 🎯 When to Use Which Version

### Use Self-Contained Version If:
- ✅ You want zero external dependencies
- ✅ You're developing locally
- ✅ You want easy setup for new developers
- ✅ You don't need cloud hosting
- ✅ You want full control over the database

### Use Supabase Version If:
- You need cloud hosting
- You want managed database services
- You need advanced Supabase features (Auth, Storage, etc.)
- You have multiple applications sharing the database

## 📝 Summary

The self-contained version is functionally identical to the Supabase version but runs completely locally. It includes:

- ✅ Same API endpoints
- ✅ Same database schema
- ✅ Same business logic
- ✅ Same frontend experience
- ✅ Same multi-tenant capabilities

The only difference is **where** the database runs: locally in Docker vs. externally in Supabase.

This makes the system much easier to set up, develop, and test, while preserving all the functionality you need.
