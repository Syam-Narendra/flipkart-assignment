# VerifyChain — Product Verification System

> Flipkart Supply Chain Digital Automation · Interview Assignment

A full-stack warehouse product verification system with bulk CSV ingestion, on-floor barcode scanning, real-time expiry validation, comprehensive reporting, and role-based access control.

---

## Architecture

```
┌────────────────────┐     REST/JSON      ┌────────────────────────┐
│  React Frontend    │ ◄────────────────► │  FastAPI Backend       │
│  (Vite + TSX)      │                    │  + SQLAlchemy ORM      │
│  Port 5173         │                    │  Port 8000             │
└────────────────────┘                    └───────────┬────────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │    Supabase     │
                                              │   (PostgreSQL)  │
                                              └─────────────────┘
```

**Tech Stack:**
- Backend: FastAPI · SQLAlchemy ORM · Pydantic v2 · JWT auth · sha256_crypt
- Frontend: React 18 · Vite · TypeScript
- Database: Supabase (PostgreSQL) — connection via `DATABASE_URL` env var
- Deployment: Docker (backend containerised on Render, frontend on Vercel)

---

## Live Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Backend API | Render (Docker) | https://flipkart-assignment.onrender.com |
| Frontend | Vercel | https://syam-flipkart-assignment.vercel.app/ |

**Backend** is deployed on [Render](https://render.com) using a Docker build from the `Dockerfile` in `backend/`. Render builds the image on every push to the connected branch.

**Frontend** is deployed on [Vercel](https://vercel.com). Set the `BACKEND_API_URL` environment variable in the Vercel project settings to point to the Render backend URL:

```
BACKEND_API_URL=https://flipkart-assignment.onrender.com
```


## How the Backend Is Organised

### Entry Point — `main.py`

`main.py` is intentionally minimal. It does exactly four things:

1. Calls `Base.metadata.create_all()` to auto-create all tables on startup.
2. Runs `seedDefaultUsers()` once at boot to ensure default credentials exist.
3. Mounts CORS middleware (allows the React dev server at port 5173).
4. Registers the five `APIRouter` instances.

```python
# main.py — no route handlers live here
app.include_router(authRouter)
app.include_router(usersRouter)
app.include_router(productsRouter)
app.include_router(verifyRouter)
app.include_router(reportsRouter)
```

### Route Files — `routes/`

Each feature has its own file, each defining a FastAPI `APIRouter` with a dedicated prefix and tag. The `routes/__init__.py` imports them all and re-exports them so `main.py` only needs one import line.

| File | Prefix | Auth guard |
|------|--------|------------|
| `auth.py` | `/auth` | Public (login), `getCurrentUser` (me) |
| `users.py` | `/users` | `requireAdmin` |
| `products.py` | `/products` | `requireAdmin` (upload), `getCurrentUser` (list) |
| `verify.py` | `/verify` | `getCurrentUser` |
| `reports.py` | `/reports` | `requireAdmin` |

---

## Database Layer

### Supabase + SQLAlchemy ORM — `db/database.py`

The app connects to Supabase (a hosted PostgreSQL service) entirely through SQLAlchemy — there is no Supabase SDK used. The connection is driven by the `DATABASE_URL` environment variable, which Supabase provides as a standard PostgreSQL connection string.

```python
# db/database.py
databaseUrl = os.environ["DATABASE_URL"]

engine = create_engine(databaseUrl, pool_pre_ping=True, pool_size=5, max_overflow=10)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
```

- `pool_pre_ping=True` — tests connections before using them, preventing stale connection errors after idle periods.
- `pool_size=5 / max_overflow=10` — allows up to 15 concurrent DB connections.
- `SessionLocal` — the session factory, used by `getDb()` below.

### Session Injection — `getDb()`

```python
def getDb():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

This is a FastAPI dependency. Route handlers declare `db: Session = Depends(getDb)` and FastAPI injects a fresh DB session per request, automatically closing it when the response is sent regardless of success or failure.

### ORM Models — `db/models.py`

Three tables are defined using SQLAlchemy's declarative ORM:

- **`User`** — id, name, username (unique), hashed_password, role, created_at
- **`Product`** — id, wid (unique), ean, manufacturing_date, expiry_date, created_at
- **`VerificationLog`** — id, wid (FK → products.wid), user_id (FK → users.id), verified_at, has_photo, photo_url

Indexes are declared explicitly for fast lookups:
- `wid` — unique index, used on every barcode scan
- `ean + expiry_date` — composite index for expiry-range queries
- `verified_at` — index for date-range report filtering

Relationships are set up with `relationship()` so that loading a `VerificationLog` can eagerly load its linked `Product` and `User` in a single query (used in reports).

### `db/__init__.py`

Re-exports everything the rest of the app needs from `db`:

```python
from .database import engine, SessionLocal, Base, getDb
from . import crud
from . import models
```

This means routes only need `from db import getDb, crud` — they never reference sub-paths.

---

## CRUD Layer — `db/crud/`

Database operations are split into three focused files instead of one monolithic `crud.py`:

### `crud/users.py`
- `getUserByUsername(db, username)` — looks up a user by username; used at login and to check uniqueness before creating.
- `getAllUsers(db)` — returns all users; used by the admin user-list endpoint.
- `createUser(db, payload)` — hashes the password and inserts a new `User` row.
- `seedDefaultUsers(db)` — see section below.

### `crud/products.py`
- `getProducts(db, skip, limit)` — paginated product list.
- `getProductByWid(db, wid)` — single product lookup by WID; used on every barcode scan.
- `bulkInsertProducts(db, products)` — batch insert, skips duplicates by pre-checking which WIDs already exist before issuing a single `INSERT` statement for the new rows only. Returns `{inserted, duplicates}`.

### `crud/logs.py`
- `createVerificationLog(db, payload, userId)` — inserts one verification event tied to the current user.
- `getLogsByDateRange(db, startDate, endDate)` — queries logs between two dates (inclusive), eager-loading the linked product and user so the reports endpoint returns full nested objects without N+1 queries.

### `crud/__init__.py`

Re-exports every function so all call sites remain `crud.functionName()` — no route file needed to change when the crud folder was introduced:

```python
from .users import getUserByUsername, getAllUsers, createUser, seedDefaultUsers
from .products import getProducts, getProductByWid, bulkInsertProducts
from .logs import createVerificationLog, getLogsByDateRange
```

---

## Default Users — `seedDefaultUsers()`

On every application startup, `main.py` opens a database session and calls:

```python
crud.seedDefaultUsers(db)
```

Inside `crud/users.py`, this function checks whether each default username already exists and only creates it if missing — making it safe to call on every boot without creating duplicates.

The credentials are read from environment variables, falling back to development defaults:

```python
defaults = [
    {
        "name":     os.getenv("ADMIN_NAME",       "Admin User"),
        "username": os.getenv("ADMIN_USERNAME",   "admin"),
        "password": os.getenv("ADMIN_PASSWORD",   "admin123"),
        "role":     "admin",
    },
    {
        "name":     os.getenv("OPERATOR_NAME",     "Warehouse Operator"),
        "username": os.getenv("OPERATOR_USERNAME", "operator"),
        "password": os.getenv("OPERATOR_PASSWORD", "op123"),
        "role":     "operator",
    },
]
```

In production, override all six env vars to prevent the default credentials from being active.

| Env Var | Default |
|---------|---------|
| `ADMIN_NAME` | Admin User |
| `ADMIN_USERNAME` | admin |
| `ADMIN_PASSWORD` | admin123 |
| `OPERATOR_NAME` | Warehouse Operator |
| `OPERATOR_USERNAME` | operator |
| `OPERATOR_PASSWORD` | op123 |

---

## Auth Layer — `auth/`

### `auth/auth.py`

All authentication and authorisation logic lives here.

**Password hashing**

```python
pwdContext = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

def hashPassword(password: str) -> str:
    return pwdContext.hash(password)

def verifyPassword(plain: str, hashed: str) -> bool:
    return pwdContext.verify(plain, hashed)
```

`passlib` with `sha256_crypt` handles one-way hashing. Raw passwords are never stored.

**JWT creation**

```python
def createAccessToken(data: dict, expiresDelta: Optional[timedelta] = None) -> str:
    ...
    return jwt.encode(toEncode, secretKey, algorithm="HS256")
```

Tokens are signed with `SECRET_KEY` (env var). Expiry defaults to `ACCESS_TOKEN_EXPIRE_MINUTES` (default 480 = 8 hours).

**Request guard — `getCurrentUser`**

A FastAPI dependency that:
1. Reads the `Authorization: Bearer <token>` header via `HTTPBearer`.
2. Decodes and validates the JWT.
3. Extracts the `sub` claim (user ID) and fetches the user from the database.
4. Returns the `User` ORM object — route handlers receive a fully populated user.

**Admin guard — `requireAdmin`**

Wraps `getCurrentUser` and additionally checks `user.role == "admin"`. Any non-admin call gets a `403 Forbidden`.

**`auth/__init__.py`**

Re-exports the five public functions so routes only need `from auth import requireAdmin, getCurrentUser` — the internal module path stays hidden.

---

## Schemas — `schemas.py`

Pydantic v2 models define the shape of every request body and response. Key models:

| Schema | Purpose |
|--------|---------|
| `LoginRequest` | `POST /auth/login` body |
| `TokenResponse` | Login response — includes `accessToken`, `tokenType`, nested `UserOut` |
| `UserCreate` | `POST /users` body — validates name length, username length, password min length, role enum |
| `UserOut` | Safe user representation — no password field |
| `ProductCreate` | Single product row parsed from CSV |
| `ProductOut` | Product response with dates and timestamps |
| `UploadResult` | CSV upload summary — inserted, duplicates, errors |
| `VerificationLogCreate` | `POST /verify/log` body |
| `VerificationLogOut` | Full log record with nested `UserOut` and `ProductOut` |

`model_config = {"from_attributes": True}` is set on output schemas so Pydantic v2 can serialize SQLAlchemy ORM objects directly.

`TokenResponse.model_rebuild()` is called at the bottom of the file to resolve the forward reference to `UserOut` inside `TokenResponse`.

---

## API Reference

```
POST   /auth/login              Login → JWT token
GET    /auth/me                 Current user info

GET    /users                   List all users              [admin]
POST   /users                   Create a new user           [admin]

POST   /products/upload         Bulk CSV upload             [admin]
GET    /products                Paginated product list      [all]

GET    /verify/{wid}            Look up product by WID      [all]
POST   /verify/log              Log a verification event    [all]

GET    /reports                 Get logs by date range      [admin]
GET    /reports/export          Download report as CSV      [admin]

GET    /health                  Health check
GET    /                        Root ping
```

Full interactive docs at `/docs` when the server is running.

---

## Feature Overview

### Bulk Product Upload
- Admin uploads a CSV with columns: `WID, EAN, Manufacturing_Date, Expiry_Date`
- Processed in batches of 500 rows — handles large files without loading everything into memory
- Duplicate WIDs are detected before insert and skipped (not errored)
- Rows with invalid data are counted as `errors` and skipped

### On-Floor Product Verification
- Operator enters WID manually or scans a barcode (barcode scanners act as keyboard input)
- Instant display of EAN, Manufacturing Date, Expiry Date
- Automatic expiry status: **VALID** / **EXPIRING SOON** (< 30 days) / **EXPIRED**
- Every scan is logged with: user, WID, timestamp, optional photo

### Verification Reports
- Admin picks a date range to filter logs
- Table view of all verification events in range
- CSV export streamed from the server (handles large result sets without buffering)

### RBAC

| Feature | Admin | Operator |
|---------|-------|----------|
| Bulk Upload | ✓ | ✗ |
| Verify Products | ✓ | ✓ |
| View Reports | ✓ | ✗ |
| Export Reports | ✓ | ✗ |
| User Management | ✓ | ✗ |

---

## Quick Start

### Prerequisites
- Python 3.12+
- Node.js 18+
- A Supabase project Session Pooler URL

### 1. Backend

```bash
cd backend

python -m venv .venv
source .venv/bin/activate        # Linux/macOS
# .venv\Scripts\activate         # Windows

pip install -r requirements.txt
```

Create a `.env` file:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
SECRET_KEY=your-long-random-secret-key

# Optional — override default seed credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
OPERATOR_USERNAME=operator
OPERATOR_PASSWORD=op123
```

Start the server:

```bash
uvicorn main:app --reload --port 8000
```

Tables are auto-created and default users are seeded on first run.  
Interactive API docs: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
bun 
bun run dev
```

Frontend: http://localhost:5173

---

## Docker Deployment

The backend ships with a `Dockerfile`:

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Dependencies are copied and installed before the application code, so Docker layer caching means re-builds only re-install packages when `requirements.txt` changes.

Example `docker-compose.yml` to run the full stack:

```yaml
version: "3.9"
services:
  api:
    build: ./backend
    ports: ["8000:8000"]
    environment:
      DATABASE_URL: postgresql://vc:vc@db/verifychain
      SECRET_KEY: change-me-in-production
      ADMIN_PASSWORD: change-me
      OPERATOR_PASSWORD: change-me
    depends_on: [db]

  frontend:
    build: ./frontend
    ports: ["80:80"]

  db:
    image: postgres:16
    environment:
      POSTGRES_USER: vc
      POSTGRES_PASSWORD: vc
      POSTGRES_DB: verifychain
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

When using Supabase in production, omit the local `db` service and point `DATABASE_URL` directly at your Supabase connection string.

---

## Scalability Notes

**Batch CSV inserts**  
Rows are processed in 500-row batches using SQLAlchemy's `insert()` (bulk statement) rather than individual `db.add()` calls — roughly 10× faster and avoids loading an entire CSV into memory.

**Duplicate detection before insert**  
`bulkInsertProducts` pre-fetches all existing WIDs for the current batch in one query, then filters in Python before issuing a single `INSERT`. This avoids per-row DB round trips and unique-constraint exception handling.

**Eager loading in reports**  
`getLogsByDateRange` uses `joinedload` to fetch `product` and `user` in the same query as the logs, preventing N+1 queries when serialising the response.

**Database indexes**  
- `wid` (unique) — O(log n) lookup per barcode scan  
- `ean + expiry_date` (composite) — fast expiry-range queries  
- `verified_at` — fast date-range filtering for reports

---

## Sample CSV

```csv
WID,EAN,Manufacturing_Date,Expiry_Date
WH-001-A,8901234567890,2024-03-15,2025-03-14
WH-001-B,8901234567890,2024-04-01,2025-03-31
WH-002-A,7501055362083,2024-01-10,2026-01-09
WH-003-X,8888888888001,2023-12-01,2024-11-30
WH-004-Z,9876543210123,2024-06-01,2027-05-31
```
