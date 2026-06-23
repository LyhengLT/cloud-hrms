-- ============================================================
-- Cloud HRMS — PostgreSQL reference schema
-- ------------------------------------------------------------
-- NOTE: The FastAPI backend auto-creates these tables via
-- SQLAlchemy on startup (Base.metadata.create_all). This file
-- is a human-readable reference and can also be used to bootstrap
-- the schema manually on AWS RDS / Google Cloud SQL.
-- ============================================================

CREATE TABLE IF NOT EXISTS departments (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(120) UNIQUE NOT NULL,
    description TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS employees (
    id              SERIAL PRIMARY KEY,
    full_name       VARCHAR(160) NOT NULL,
    email           VARCHAR(160) UNIQUE NOT NULL,
    phone           VARCHAR(40)  DEFAULT '',
    position        VARCHAR(120) DEFAULT '',
    base_salary     DOUBLE PRECISION DEFAULT 0,
    hire_date       DATE DEFAULT CURRENT_DATE,
    is_active       BOOLEAN DEFAULT TRUE,
    department_id   INTEGER REFERENCES departments(id),
    hashed_password VARCHAR(255) NOT NULL,
    role            VARCHAR(20)  NOT NULL DEFAULT 'EMPLOYEE'  -- ADMIN | HR | EMPLOYEE
);
CREATE INDEX IF NOT EXISTS ix_employees_email ON employees(email);

CREATE TABLE IF NOT EXISTS attendance (
    id          SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    work_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in    TIMESTAMP,
    check_out   TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leave_requests (
    id          SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    leave_type  VARCHAR(60) DEFAULT 'Annual',
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    reason      TEXT DEFAULT '',
    status      VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING | APPROVED | REJECTED
    reviewed_by INTEGER REFERENCES employees(id),
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payslips (
    id           SERIAL PRIMARY KEY,
    employee_id  INTEGER NOT NULL REFERENCES employees(id),
    period       VARCHAR(7) NOT NULL,  -- YYYY-MM
    base_salary  DOUBLE PRECISION DEFAULT 0,
    allowances   DOUBLE PRECISION DEFAULT 0,
    deductions   DOUBLE PRECISION DEFAULT 0,
    net_pay      DOUBLE PRECISION DEFAULT 0,
    generated_at TIMESTAMP DEFAULT NOW()
);
