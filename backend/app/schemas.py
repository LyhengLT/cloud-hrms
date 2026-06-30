from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

from .models import LeaveStatus, Role


# ---------- Auth ----------
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Role
    employee_id: int
    full_name: str


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    token: str
    new_password: str


class MessageOut(BaseModel):
    message: str


# ---------- Department ----------
class DepartmentBase(BaseModel):
    name: str
    description: str = ""


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentOut(DepartmentBase):
    id: int
    employee_count: int = 0

    class Config:
        from_attributes = True


# ---------- Employee ----------
class EmployeeBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: str = ""
    position: str = ""
    base_salary: float = 0.0
    department_id: Optional[int] = None
    role: Role = Role.EMPLOYEE
    is_active: bool = True


class EmployeeCreate(EmployeeBase):
    password: str
    hire_date: Optional[date] = None


class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    base_salary: Optional[float] = None
    department_id: Optional[int] = None
    role: Optional[Role] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class EmployeeOut(EmployeeBase):
    id: int
    hire_date: Optional[date] = None
    department_name: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- Attendance ----------
class AttendanceOut(BaseModel):
    id: int
    employee_id: int
    work_date: date
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    employee_name: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- Leave ----------
class LeaveCreate(BaseModel):
    leave_type: str = "Annual"
    start_date: date
    end_date: date
    reason: str = ""


class LeaveReview(BaseModel):
    status: LeaveStatus


class LeaveOut(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    leave_type: str
    start_date: date
    end_date: date
    reason: str
    status: LeaveStatus
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Payroll ----------
class PayslipCreate(BaseModel):
    employee_id: int
    period: str  # YYYY-MM
    allowances: float = 0.0
    deductions: float = 0.0


class PayslipOut(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    period: str
    base_salary: float
    allowances: float
    deductions: float
    net_pay: float
    generated_at: datetime

    class Config:
        from_attributes = True
