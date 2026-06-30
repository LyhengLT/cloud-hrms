"""Minimal SMTP email sender for password-reset links."""
import smtplib
from email.message import EmailMessage

from .config import settings


def send_reset_email(to_email: str, reset_link: str) -> None:
    """Send a password-reset email. If SMTP isn't configured, log the link
    to the server console (so the flow still works in local dev)."""
    subject = "Reset your Cloud HRMS password"
    text = (
        f"We received a request to reset your Cloud HRMS password.\n\n"
        f"Click the link below to choose a new password "
        f"(it expires in {settings.RESET_TOKEN_EXPIRE_MINUTES} minutes):\n\n"
        f"{reset_link}\n\n"
        f"If you didn't request this, you can safely ignore this email."
    )
    html = f"""\
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
      <h2 style="color:#4f46e5">Cloud HRMS</h2>
      <p>We received a request to reset your password.</p>
      <p><a href="{reset_link}"
            style="display:inline-block;background:#4f46e5;color:#fff;
                   padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">
            Reset password</a></p>
      <p style="color:#64748b;font-size:13px">
        This link expires in {settings.RESET_TOKEN_EXPIRE_MINUTES} minutes.
        If you didn't request it, ignore this email.</p>
      <p style="color:#94a3b8;font-size:12px">{reset_link}</p>
    </div>"""

    if not settings.SMTP_HOST or not settings.SMTP_USER:
        print(f"[email] SMTP not configured — reset link for {to_email}: {reset_link}")
        return

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
    msg["To"] = to_email
    msg.set_content(text)
    msg.add_alternative(html, subtype="html")

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
    print(f"[email] Reset email sent to {to_email}")
