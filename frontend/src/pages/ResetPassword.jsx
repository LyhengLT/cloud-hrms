import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();

  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (pw.length < 6) return setError("Password must be at least 6 characters");
    if (pw !== confirm) return setError("Passwords do not match");
    setBusy(true);
    try {
      await api.resetPassword(token, pw);
      setDone(true);
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="lh-login">
      <form className="lh-login-card" onSubmit={handleSubmit}>
        <h1 className="lh-login-title">Set a new password</h1>
        <p className="lh-login-sub">Choose a strong password you'll remember.</p>

        {error && <div className="lh-error">{error}</div>}

        {!token ? (
          <div className="lh-error">This reset link is missing its token. Request a new one.</div>
        ) : done ? (
          <div
            style={{
              background: "#dcfce7", color: "#16a34a", padding: "12px 14px",
              borderRadius: 10, fontSize: 14, textAlign: "center",
            }}
          >
            Password updated! Redirecting to sign in…
          </div>
        ) : (
          <>
            <div className="lh-field">
              <label>New password</label>
              <input className="lh-input" type="password" value={pw} placeholder="••••••••"
                onChange={(e) => setPw(e.target.value)} required />
            </div>
            <div className="lh-field">
              <label>Confirm password</label>
              <input className="lh-input" type="password" value={confirm} placeholder="••••••••"
                onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            <button className="lh-btn lh-block" type="submit" disabled={busy}>
              {busy ? "Updating…" : "Update password"}
            </button>
          </>
        )}

        <p style={{ textAlign: "center", marginTop: 18, fontSize: 14 }}>
          <Link to="/login" style={{ color: "var(--lh-primary)", fontWeight: 600 }}>
            Back to sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
