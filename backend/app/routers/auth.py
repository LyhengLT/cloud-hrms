from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Employee
from ..schemas import EmployeeOut, Token
from ..security import create_access_token, get_current_user, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # OAuth2 form uses `username` field — we treat it as email.
    user = db.query(Employee).filter(Employee.email == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive")

    token = create_access_token(user.id, user.role)
    return Token(
        access_token=token,
        role=user.role,
        employee_id=user.id,
        full_name=user.full_name,
    )


@router.get("/me", response_model=EmployeeOut)
def me(user: Employee = Depends(get_current_user)):
    out = EmployeeOut.model_validate(user)
    out.department_name = user.department.name if user.department else None
    return out
