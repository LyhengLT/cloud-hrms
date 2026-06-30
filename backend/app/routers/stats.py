from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Department, Employee, LeaveRequest, LeaveStatus, Payslip, Role
from ..security import require_hr

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("")
def overview(db: Session = Depends(get_db), _: Employee = Depends(require_hr)):
    """Aggregated metrics for the admin Reports page."""
    total = db.query(func.count(Employee.id)).scalar() or 0
    active = db.query(func.count(Employee.id)).filter(Employee.is_active == True).scalar() or 0  # noqa: E712

    # Headcount per department (includes empty departments)
    dept_rows = (
        db.query(Department.name, func.count(Employee.id))
        .outerjoin(Employee, Employee.department_id == Department.id)
        .group_by(Department.name)
        .order_by(func.count(Employee.id).desc())
        .all()
    )
    departments = [{"name": n, "count": c} for n, c in dept_rows]

    # Role distribution
    role_rows = db.query(Employee.role, func.count(Employee.id)).group_by(Employee.role).all()
    roles = {r.value: 0 for r in Role}
    for role, count in role_rows:
        roles[role.value if hasattr(role, "value") else role] = count

    # Leave status counts
    leave_rows = db.query(LeaveRequest.status, func.count(LeaveRequest.id)).group_by(LeaveRequest.status).all()
    leaves = {s.value: 0 for s in LeaveStatus}
    for st, count in leave_rows:
        leaves[st.value if hasattr(st, "value") else st] = count

    # Payroll totals
    payroll_total = db.query(func.coalesce(func.sum(Payslip.net_pay), 0.0)).scalar() or 0.0
    month = datetime.utcnow().strftime("%Y-%m")
    payroll_month = (
        db.query(func.coalesce(func.sum(Payslip.net_pay), 0.0))
        .filter(Payslip.period == month)
        .scalar()
        or 0.0
    )
    avg_salary = db.query(func.coalesce(func.avg(Employee.base_salary), 0.0)).scalar() or 0.0

    return {
        "employees": total,
        "active_employees": active,
        "inactive_employees": total - active,
        "departments": departments,
        "roles": roles,
        "leaves": leaves,
        "payroll_total": round(float(payroll_total), 2),
        "payroll_this_month": round(float(payroll_month), 2),
        "avg_base_salary": round(float(avg_salary), 2),
        "month": month,
    }
