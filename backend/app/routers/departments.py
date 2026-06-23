from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Department, Employee
from ..schemas import DepartmentCreate, DepartmentOut
from ..security import get_current_user, require_admin, require_hr

router = APIRouter(prefix="/api/departments", tags=["departments"])


def _to_out(dep: Department) -> DepartmentOut:
    out = DepartmentOut.model_validate(dep)
    out.employee_count = len(dep.employees)
    return out


@router.get("", response_model=list[DepartmentOut])
def list_departments(db: Session = Depends(get_db), _: Employee = Depends(get_current_user)):
    return [_to_out(d) for d in db.query(Department).order_by(Department.name).all()]


@router.post("", response_model=DepartmentOut, status_code=201)
def create_department(
    payload: DepartmentCreate,
    db: Session = Depends(get_db),
    _: Employee = Depends(require_hr),
):
    if db.query(Department).filter(Department.name == payload.name).first():
        raise HTTPException(400, "Department already exists")
    dep = Department(**payload.model_dump())
    db.add(dep)
    db.commit()
    db.refresh(dep)
    return _to_out(dep)


@router.put("/{dep_id}", response_model=DepartmentOut)
def update_department(
    dep_id: int,
    payload: DepartmentCreate,
    db: Session = Depends(get_db),
    _: Employee = Depends(require_hr),
):
    dep = db.query(Department).get(dep_id)
    if not dep:
        raise HTTPException(404, "Department not found")
    dep.name = payload.name
    dep.description = payload.description
    db.commit()
    db.refresh(dep)
    return _to_out(dep)


@router.delete("/{dep_id}", status_code=204)
def delete_department(
    dep_id: int,
    db: Session = Depends(get_db),
    _: Employee = Depends(require_admin),  # ADMIN only — destructive
):
    dep = db.query(Department).get(dep_id)
    if not dep:
        raise HTTPException(404, "Department not found")
    if dep.employees:
        raise HTTPException(400, "Cannot delete a department that still has employees")
    db.delete(dep)
    db.commit()
