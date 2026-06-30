import hashlib
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..email_util import send_reset_email
from ..models import Employee, PasswordResetToken
from ..schemas import (
    EmployeeOut, ForgotPasswordIn, MessageOut, ResetPasswordIn, Token,
)
from ..security import (
    create_access_token, get_current_user, hash_password, verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


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


@router.post("/forgot-password", response_model=MessageOut)
def forgot_password(payload: ForgotPasswordIn, db: Session = Depends(get_db)):
    GENERIC = MessageOut(
        message="If that email exists, a reset link has been sent."
    )
    user = db.query(Employee).filter(Employee.email == payload.email).first()
    # Always return the same response so we don't reveal which emails exist.
    if not user or not user.is_active:
        return GENERIC

    # Invalidate any previous unused tokens for this user.
    db.query(PasswordResetToken).filter(
        PasswordResetToken.employee_id == user.id,
        PasswordResetToken.used == False,  # noqa: E712
    ).update({"used": True})

    raw_token = secrets.token_urlsafe(32)
    reset = PasswordResetToken(
        employee_id=user.id,
        token_hash=_hash_token(raw_token),
        expires_at=datetime.utcnow() + timedelta(minutes=settings.RESET_TOKEN_EXPIRE_MINUTES),
    )
    db.add(reset)
    db.commit()

    link = f"{settings.FRONTEND_URL}/reset-password?token={raw_token}"
    try:
        send_reset_email(user.email, link)
    except Exception as e:  # don't leak SMTP errors to the client
        print(f"[email] failed to send reset email: {e}")
    return GENERIC


@router.post("/reset-password", response_model=MessageOut)
def reset_password(payload: ResetPasswordIn, db: Session = Depends(get_db)):
    if len(payload.new_password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")

    token_hash = _hash_token(payload.token)
    reset = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.token_hash == token_hash)
        .first()
    )
    if not reset or reset.used or reset.expires_at < datetime.utcnow():
        raise HTTPException(400, "Invalid or expired reset link")

    user = db.query(Employee).get(reset.employee_id)
    if not user:
        raise HTTPException(400, "Invalid reset link")

    user.hashed_password = hash_password(payload.new_password)
    reset.used = True
    db.commit()
    return MessageOut(message="Password updated. You can now sign in.")
