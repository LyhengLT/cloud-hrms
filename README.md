# Cloud-Based Human Resource Management System (HRMS)

A full-stack, cloud-ready HRMS. React frontend, FastAPI backend, PostgreSQL database — fully containerized with Docker Compose and designed to deploy to **AWS** (EC2 + RDS) or **Google Cloud** (Compute Engine + Cloud SQL).

## Features

- **Auth & RBAC** — JWT login with three roles: `ADMIN`, `HR`, `EMPLOYEE`.
- **Employees** — full CRUD, search, department assignment (HR/Admin).
- **Departments** — CRUD with live headcount.
- **Attendance** — employee check-in / check-out; HR sees all records.
- **Leave** — employees request time off; HR approves/rejects (workflow).
- **Payroll** — HR generates payslips (base + allowances − deductions = net pay); employees view their own.
- **Dashboard** — role-aware summary cards.

## Tech stack

| Layer     | Technology                                  |
|-----------|---------------------------------------------|
| Frontend  | React 18 + Vite + React Router              |
| Backend   | Python · FastAPI · SQLAlchemy · JWT         |
| Database  | PostgreSQL (AWS RDS / Google Cloud SQL)     |
| Infra     | Docker + Docker Compose, Nginx (serve SPA)  |

## Project structure

```
cloud/
├── docker-compose.yml      # postgres + backend + frontend
├── .env.example            # copy to .env
├── backend/                # FastAPI app
│   └── app/
│       ├── main.py         # app + routers + startup (create tables, seed)
│       ├── models.py       # SQLAlchemy models
│       ├── schemas.py      # Pydantic schemas
│       ├── security.py     # JWT + password hashing + RBAC deps
│       ├── seed.py         # demo departments + users
│       └── routers/        # auth, employees, departments, attendance, leave, payroll
├── frontend/               # React + Vite SPA
│   └── src/
│       ├── pages/          # Login, Dashboard, Employees, Departments, Attendance, Leaves, Payroll
│       ├── components/     # Layout (sidebar + topbar)
│       ├── context/        # AuthContext
│       └── api.js          # fetch wrapper
└── database/               # schema.sql + DB/backup notes
```

## Quick start (Docker — recommended)

```bash
cp .env.example .env        # optional: edit secrets
docker compose up --build
```

Then open:

- **Frontend:** http://localhost:5173
- **API docs (Swagger):** http://localhost:8000/docs
- **PostgreSQL:** localhost:5432

The backend auto-creates tables and seeds demo data on first start.

### Demo accounts

| Role     | Email               | Password |
|----------|---------------------|----------|
| Admin    | admin@hrms.com      | admin123 |
| HR       | hr@hrms.com         | hr123    |
| Employee | employee@hrms.com   | emp123   |

## Run without Docker (local dev)

**Backend**
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# Postgres must be running; set DATABASE_URL (see backend/.env.example)
export DATABASE_URL="postgresql+psycopg2://hrms:hrms_pass@localhost:5432/hrms"
export JWT_SECRET="dev-secret"
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173, proxies /api to :8000
```

## API overview

| Method | Endpoint                       | Access        |
|--------|--------------------------------|---------------|
| POST   | `/api/auth/login`              | public        |
| GET    | `/api/auth/me`                 | any logged-in |
| GET/POST/PUT/DELETE | `/api/employees`  | HR / Admin    |
| GET/POST/PUT/DELETE | `/api/departments`| read: all · write: HR/Admin |
| POST   | `/api/attendance/check-in/out` | employee      |
| GET    | `/api/attendance`              | HR / Admin    |
| POST   | `/api/leaves`                  | any logged-in |
| PATCH  | `/api/leaves/{id}/review`      | HR / Admin    |
| POST   | `/api/payroll`                 | HR / Admin    |

Full interactive docs at `/docs`.

## Cloud deployment (AWS)

1. **Database — AWS RDS for PostgreSQL:** create an instance, enable automated
   backups, and note the endpoint.
2. **Backend — EC2 (or ECS):** install Docker, set
   `DATABASE_URL` to the RDS endpoint and a strong `JWT_SECRET`, then run the
   backend container. Open port 8000 (behind a load balancer / Nginx).
3. **Frontend:** build (`npm run build`) and serve the `dist/` folder via the
   provided Nginx image, S3 + CloudFront, or the same EC2 host.
4. **Security:** put the DB in a private subnet, restrict its security group to
   the backend, and serve everything over HTTPS.

See [`database/README.md`](./database/README.md) for backup & recovery details.

## Key cloud concepts demonstrated

- **Cloud storage & database** — managed PostgreSQL (RDS / Cloud SQL).
- **Remote access** — web app reachable from anywhere over HTTPS.
- **Automatic backup & recovery** — RDS automated backups + snapshots.
- **Data security** — hashed passwords (bcrypt), JWT auth, role-based access control.
