"""Seed initial data: departments + demo users for each role."""
from datetime import date

from .database import SessionLocal
from .models import Department, Employee, Role
from .security import hash_password


def seed():
    db = SessionLocal()
    try:
        if db.query(Employee).count() > 0:
            return  # already seeded

        eng = Department(name="Engineering", description="Software & infrastructure")
        hr = Department(name="Human Resources", description="People operations")
        sales = Department(name="Sales", description="Revenue & accounts")
        db.add_all([eng, hr, sales])
        db.flush()

        users = [
            Employee(
                full_name="System Admin", email="admin@hrms.com",
                position="System Administrator", base_salary=4000,
                hire_date=date(2023, 1, 1), department_id=eng.id,
                role=Role.ADMIN, hashed_password=hash_password("admin123"),
            ),
            Employee(
                full_name="Helen Reyes", email="hr@hrms.com",
                position="HR Manager", base_salary=2500,
                hire_date=date(2023, 3, 15), department_id=hr.id,
                role=Role.HR, hashed_password=hash_password("hr123"),
            ),
            Employee(
                full_name="Dara Sok", email="employee@hrms.com",
                position="Software Engineer", base_salary=1800,
                hire_date=date(2024, 6, 1), department_id=eng.id,
                role=Role.EMPLOYEE, hashed_password=hash_password("emp123"),
            ),
            Employee(
                full_name="Sophea Chan", email="sophea@hrms.com",
                position="Sales Executive", base_salary=1500,
                hire_date=date(2024, 9, 10), department_id=sales.id,
                role=Role.EMPLOYEE, hashed_password=hash_password("emp123"),
            ),
        ]
        db.add_all(users)
        db.commit()
        print("[seed] Inserted demo departments and users.")
    finally:
        db.close()
