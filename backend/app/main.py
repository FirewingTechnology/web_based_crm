from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routes import auth, users, builders, projects, leads, followups, brokers, sales, bookings, commissions, reports, notifications, activity_logs, settings as settings_route

# Create database tables automatically if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs"
)

@app.on_event("startup")
def startup_db_seed():
    Base.metadata.create_all(bind=engine)
    try:
        from app.database import SessionLocal
        from app.models.user import User
        from app.seed import seed_db
        db = SessionLocal()
        user_count = db.query(User).count()
        if user_count == 0:
            print("[RENDER STARTUP] Database empty. Seeding initial admin and sales accounts...")
            seed_db()
        db.close()
    except Exception as e:
        print(f"[RENDER STARTUP] Seeding check: {e}")

# CORS Middleware setup
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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

@app.get("/")
def root():
    return {"message": "REALVION API is running", "version": "1.0.0"}
