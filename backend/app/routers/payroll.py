from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Employee, Payslip
from ..schemas import PayslipCreate, PayslipOut
from ..security import get_current_user, require_hr

router = APIRouter(prefix="/api/payroll", tags=["payroll"])


def _to_out(p: Payslip) -> PayslipOut:
    out = PayslipOut.model_validate(p)
    out.employee_name = p.employee.full_name if p.employee else None
    return out


@router.post("", response_model=PayslipOut, status_code=201)
def generate_payslip(
    payload: PayslipCreate,
    db: Session = Depends(get_db),
    _: Employee = Depends(require_hr),
):
    emp = db.query(Employee).get(payload.employee_id)
    if not emp:
        raise HTTPException(404, "Employee not found")

    existing = (
        db.query(Payslip)
        .filter(Payslip.employee_id == emp.id, Payslip.period == payload.period)
        .first()
    )
    if existing:
        raise HTTPException(400, f"Payslip for {payload.period} already exists")

    net = emp.base_salary + payload.allowances - payload.deductions
    slip = Payslip(
        employee_id=emp.id,
        period=payload.period,
        base_salary=emp.base_salary,
        allowances=payload.allowances,
        deductions=payload.deductions,
        net_pay=net,
    )
    db.add(slip)
    db.commit()
    db.refresh(slip)
    return _to_out(slip)


@router.get("/me", response_model=list[PayslipOut])
def my_payslips(db: Session = Depends(get_db), user: Employee = Depends(get_current_user)):
    rows = (
        db.query(Payslip)
        .filter(Payslip.employee_id == user.id)
        .order_by(Payslip.period.desc())
        .all()
    )
    return [_to_out(p) for p in rows]


@router.get("", response_model=list[PayslipOut])
def all_payslips(
    period: str | None = None,
    db: Session = Depends(get_db),
    _: Employee = Depends(require_hr),
):
    query = db.query(Payslip)
    if period:
        query = query.filter(Payslip.period == period)
    rows = query.order_by(Payslip.period.desc()).all()
    return [_to_out(p) for p in rows]
