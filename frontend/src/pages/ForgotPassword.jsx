import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="lh-login">
      <form className="lh-login-card" onSubmit={handleSubmit}>
        <h1 className="lh-login-title">Forgot password?</h1>
        <p className="lh-login-sub">We'll email you a link to reset it.</p>

        {error && <div className="lh-error">{error}</div>}

        {sent ? (
          <>
            <div
              style={{
                background: "#dcfce7", color: "#16a34a", padding: "12px 14px",
                borderRadius: 10, fontSize: 14, marginBottom: 16, textAlign: "center",
              }}
            >
              If that email exists, a reset link is on its way. Check your inbox.
            </div>
            <Link to="/login" className="lh-btn lh-block" style={{ textAlign: "center", textDecoration: "none", display: "block" }}>
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <div className="lh-field">
              <label>Email</label>
              <input className="lh-input" type="email" value={email} placeholder="you@company.com"
                onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <button className="lh-btn lh-block" type="submit" disabled={busy}>
              {busy ? "Sending…" : "Send reset link"}
            </button>
            <p style={{ textAlign: "center", marginTop: 18, fontSize: 14 }}>
              <Link to="/login" style={{ color: "var(--lh-primary)", fontWeight: 600 }}>
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </form>
    </div>
  );
}
