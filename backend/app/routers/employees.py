from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Department, Employee, Role
from ..schemas import EmployeeCreate, EmployeeOut, EmployeeUpdate
from ..security import get_current_user, hash_password, require_admin, require_hr

# Roles only an ADMIN may assign or modify
PRIVILEGED_ROLES = {Role.ADMIN, Role.HR}

router = APIRouter(prefix="/api/employees", tags=["employees"])


def _to_out(emp: Employee) -> EmployeeOut:
    out = EmployeeOut.model_validate(emp)
    out.department_name = emp.department.name if emp.department else None
    return out


@router.get("", response_model=list[EmployeeOut])
def list_employees(
    q: str | None = None,
    department_id: int | None = None,
    db: Session = Depends(get_db),
    _: Employee = Depends(require_hr),
):
    query = db.query(Employee)
    if q:
        like = f"%{q}%"
        query = query.filter(
            (Employee.full_name.ilike(like)) | (Employee.email.ilike(like))
        )
    if department_id:
        query = query.filter(Employee.department_id == department_id)
    return [_to_out(e) for e in query.order_by(Employee.full_name).all()]


@router.get("/{emp_id}", response_model=EmployeeOut)
def get_employee(
    emp_id: int,
    db: Session = Depends(get_db),
    user: Employee = Depends(get_current_user),
):
    # Employees may view only themselves; HR/Admin may view anyone.
    if user.role.value == "EMPLOYEE" and user.id != emp_id:
        raise HTTPException(403, "Insufficient permissions")
    emp = db.query(Employee).get(emp_id)
    if not emp:
        raise HTTPException(404, "Employee not found")
    return _to_out(emp)


@router.post("", response_model=EmployeeOut, status_code=201)
def create_employee(
    payload: EmployeeCreate,
    db: Session = Depends(get_db),
    actor: Employee = Depends(require_hr),
):
    # Only ADMIN may create HR or ADMIN accounts; HR may create EMPLOYEEs only.
    if payload.role in PRIVILEGED_ROLES and actor.role != Role.ADMIN:
        raise HTTPException(403, "Only an Admin can create HR or Admin accounts")
    if db.query(Employee).filter(Employee.email == payload.email).first():
        raise HTTPException(400, "Email already registered")
    if payload.department_id and not db.query(Department).get(payload.department_id):
        raise HTTPException(400, "Department not found")

    data = payload.model_dump(exclude={"password"})
    emp = Employee(
        **data,
        hashed_password=hash_password(payload.password),
    )
    if not emp.hire_date:
        emp.hire_date = date.today()
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return _to_out(emp)


@router.put("/{emp_id}", response_model=EmployeeOut)
def update_employee(
    emp_id: int,
    payload: EmployeeUpdate,
    db: Session = Depends(get_db),
    actor: Employee = Depends(require_hr),
):
    emp = db.query(Employee).get(emp_id)
    if not emp:
        raise HTTPException(404, "Employee not found")

    data = payload.model_dump(exclude_unset=True)

    # RBAC: HR may only manage regular employees and cannot grant elevated roles.
    if actor.role != Role.ADMIN:
        if emp.role in PRIVILEGED_ROLES:
            raise HTTPException(403, "Only an Admin can modify HR or Admin accounts")
        new_role = data.get("role")
        if new_role is not None and Role(new_role) in PRIVILEGED_ROLES:
            raise HTTPException(403, "Only an Admin can promote a user to HR or Admin")
    if "password" in data:
        pw = data.pop("password")
        if pw:
            emp.hashed_password = hash_password(pw)
    for key, value in data.items():
        setattr(emp, key, value)
    db.commit()
    db.refresh(emp)
    return _to_out(emp)


@router.delete("/{emp_id}", status_code=204)
def delete_employee(
    emp_id: int,
    db: Session = Depends(get_db),
    actor: Employee = Depends(require_admin),  # ADMIN only — destructive
):
    emp = db.query(Employee).get(emp_id)
    if not emp:
        raise HTTPException(404, "Employee not found")
    if emp.id == actor.id:
        raise HTTPException(400, "You cannot delete your own account")
    db.delete(emp)
    db.commit()
