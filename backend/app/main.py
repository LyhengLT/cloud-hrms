from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .routers import attendance, auth, departments, employees, leave, payroll, stats
from .seed import seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables (for production use Alembic migrations instead).
    Base.metadata.create_all(bind=engine)
    if settings.SEED_ON_START:
        seed()
    yield


app = FastAPI(
    title="Cloud HRMS API",
    description="Cloud-Based Human Resource Management System",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(departments.router)
app.include_router(employees.router)
app.include_router(attendance.router)
app.include_router(leave.router)
app.include_router(payroll.router)
app.include_router(stats.router)


@app.get("/")
def root():
    return {"service": "Cloud HRMS API", "status": "ok", "docs": "/docs"}


@app.get("/api/health")
def health():
    return {"status": "healthy"}
