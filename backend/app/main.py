import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routes import auth, users, builders, projects, leads, followups, brokers, sales, bookings, commissions, reports, notifications, activity_logs, settings as settings_route, registration, payments, saas_admin

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

SENTRY_DSN = os.getenv("SENTRY_DSN", "")

if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        traces_sample_rate=0.2,
        integrations=[FastApiIntegration()]
    )

# Gate auto table creation — Alembic migrations are canonical for production PostgreSQL
if os.getenv("ENABLE_AUTO_CREATE_ALL", "false").lower() == "true":
    Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs"
)

from fastapi import Request
from fastapi.responses import JSONResponse
import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_msg = str(exc) or exc.__class__.__name__
    print(f"[UNHANDLED EXCEPTION] {request.method} {request.url.path}: {error_msg}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {error_msg}"}
    )

from app.middleware.auth_middleware import RequireRole
from app.models.user import UserRole

@app.get(f"{settings.API_V1_STR}/debug-sentry")
def trigger_sentry_test_error(current_user=Depends(RequireRole([UserRole.SUPERADMIN]))):
    """Deliberate test error endpoint to verify Sentry alert triggering (SuperAdmin Protected)."""
    raise ValueError("[REALVION SENTRY TEST] Deliberate test exception for error monitoring verification.")


@app.on_event("startup")
def startup_db_seed():

    if os.getenv("ENABLE_AUTO_CREATE_ALL", "false").lower() == "true":
        Base.metadata.create_all(bind=engine)

    try:
        from app.database import SessionLocal
        from app.models.user import User
        from app.seed import seed_db, ensure_seed_users
        db = SessionLocal()
        user_count = db.query(User).count()
        if user_count == 0:
            print("[RENDER STARTUP] Database empty. Seeding initial admin and sales accounts...")
            seed_db()
        else:
            print("[RENDER STARTUP] Database active. Ensuring superadmin@realvion.com exists...")
            ensure_seed_users(db)
        db.close()
    except Exception as e:
        print(f"[RENDER STARTUP] Seeding check: {e}")

# CORS Middleware setup - Strict origins from config/env without wildcard when allow_credentials=True
origins = [
    settings.FRONTEND_URL,
    settings.WEBSITE_URL,
    settings.CRM_URL,
    "https://web-based-crm-1.onrender.com",
    "https://realvion-frontend.onrender.com",
    "https://realvion-official-site.onrender.com",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:5176",
    "http://127.0.0.1:5176",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Filter duplicates and empty strings
allowed_origins = list(set([o.strip() for o in origins if o and o.strip() and o != "*"]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include API Routers
api_v1 = settings.API_V1_STR
app.include_router(auth.router, prefix=api_v1)
app.include_router(users.router, prefix=api_v1)
app.include_router(builders.router, prefix=api_v1)
app.include_router(projects.router, prefix=api_v1)
app.include_router(leads.router, prefix=api_v1)
app.include_router(followups.router, prefix=api_v1)
app.include_router(brokers.router, prefix=api_v1)
app.include_router(sales.router, prefix=api_v1)
app.include_router(bookings.router, prefix=api_v1)
app.include_router(commissions.router, prefix=api_v1)
app.include_router(reports.router, prefix=api_v1)
app.include_router(notifications.router, prefix=api_v1)
app.include_router(activity_logs.router, prefix=api_v1)
app.include_router(settings_route.router, prefix=api_v1)
app.include_router(registration.router, prefix=api_v1)
app.include_router(payments.router, prefix=api_v1)
app.include_router(saas_admin.router, prefix=api_v1)

@app.get("/")
def root():
    return {"message": "REALVION API is running", "version": "2.0.0"}

