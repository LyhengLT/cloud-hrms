from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Attendance, Employee
from ..schemas import AttendanceOut
from ..security import get_current_user, require_hr

router = APIRouter(prefix="/api/attendance", tags=["attendance"])


def _to_out(a: Attendance) -> AttendanceOut:
    out = AttendanceOut.model_validate(a)
    out.employee_name = a.employee.full_name if a.employee else None
    return out


@router.post("/check-in", response_model=AttendanceOut)
def check_in(db: Session = Depends(get_db), user: Employee = Depends(get_current_user)):
    today = date.today()
    rec = (
        db.query(Attendance)
        .filter(Attendance.employee_id == user.id, Attendance.work_date == today)
        .first()
    )
    if rec and rec.check_in:
        raise HTTPException(400, "Already checked in today")
    if not rec:
        rec = Attendance(employee_id=user.id, work_date=today)
        db.add(rec)
    rec.check_in = datetime.utcnow()
    db.commit()
    db.refresh(rec)
    return _to_out(rec)


@router.post("/check-out", response_model=AttendanceOut)
def check_out(db: Session = Depends(get_db), user: Employee = Depends(get_current_user)):
    today = date.today()
    rec = (
        db.query(Attendance)
        .filter(Attendance.employee_id == user.id, Attendance.work_date == today)
        .first()
    )
    if not rec or not rec.check_in:
        raise HTTPException(400, "You must check in first")
    if rec.check_out:
        raise HTTPException(400, "Already checked out today")
    rec.check_out = datetime.utcnow()
    db.commit()
    db.refresh(rec)
    return _to_out(rec)


@router.get("/me", response_model=list[AttendanceOut])
def my_attendance(db: Session = Depends(get_db), user: Employee = Depends(get_current_user)):
    rows = (
        db.query(Attendance)
        .filter(Attendance.employee_id == user.id)
        .order_by(Attendance.work_date.desc())
        .all()
    )
    return [_to_out(a) for a in rows]


@router.get("", response_model=list[AttendanceOut])
def all_attendance(
    work_date: date | None = None,
    db: Session = Depends(get_db),
    _: Employee = Depends(require_hr),
):
    query = db.query(Attendance)
    if work_date:
        query = query.filter(Attendance.work_date == work_date)
    rows = query.order_by(Attendance.work_date.desc(), Attendance.employee_id).all()
    return [_to_out(a) for a in rows]
