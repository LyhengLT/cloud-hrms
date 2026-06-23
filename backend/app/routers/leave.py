from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Employee, LeaveRequest, LeaveStatus
from ..schemas import LeaveCreate, LeaveOut, LeaveReview
from ..security import get_current_user, require_hr

router = APIRouter(prefix="/api/leaves", tags=["leaves"])


def _to_out(lv: LeaveRequest) -> LeaveOut:
    out = LeaveOut.model_validate(lv)
    out.employee_name = lv.employee.full_name if lv.employee else None
    return out


@router.post("", response_model=LeaveOut, status_code=201)
def request_leave(
    payload: LeaveCreate,
    db: Session = Depends(get_db),
    user: Employee = Depends(get_current_user),
):
    if payload.end_date < payload.start_date:
        raise HTTPException(400, "End date cannot be before start date")
    lv = LeaveRequest(employee_id=user.id, **payload.model_dump())
    db.add(lv)
    db.commit()
    db.refresh(lv)
    return _to_out(lv)


@router.get("/me", response_model=list[LeaveOut])
def my_leaves(db: Session = Depends(get_db), user: Employee = Depends(get_current_user)):
    rows = (
        db.query(LeaveRequest)
        .filter(LeaveRequest.employee_id == user.id)
        .order_by(LeaveRequest.created_at.desc())
        .all()
    )
    return [_to_out(l) for l in rows]


@router.get("", response_model=list[LeaveOut])
def all_leaves(
    status: LeaveStatus | None = None,
    db: Session = Depends(get_db),
    _: Employee = Depends(require_hr),
):
    query = db.query(LeaveRequest)
    if status:
        query = query.filter(LeaveRequest.status == status)
    rows = query.order_by(LeaveRequest.created_at.desc()).all()
    return [_to_out(l) for l in rows]


@router.patch("/{leave_id}/review", response_model=LeaveOut)
def review_leave(
    leave_id: int,
    payload: LeaveReview,
    db: Session = Depends(get_db),
    reviewer: Employee = Depends(require_hr),
):
    lv = db.query(LeaveRequest).get(leave_id)
    if not lv:
        raise HTTPException(404, "Leave request not found")
    if lv.status != LeaveStatus.PENDING:
        raise HTTPException(400, "Leave request already reviewed")
    lv.status = payload.status
    lv.reviewed_by = reviewer.id
    db.commit()
    db.refresh(lv)
    return _to_out(lv)
