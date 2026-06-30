import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="lh-login">
      <form className="lh-login-card" onSubmit={handleSubmit}>
        <h1 className="lh-login-title">⛅ Cloud HRMS</h1>
        <p className="lh-login-sub">Human Resource Management System</p>

        {error && <div className="lh-error">{error}</div>}

        <div className="lh-field">
          <label>Email</label>
          <input className="lh-input" type="email" value={email} placeholder="you@company.com"
            autoComplete="off" onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="lh-field">
          <label>Password</label>
          <input className="lh-input" type="password" value={password} placeholder="••••••••"
            autoComplete="new-password" onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <button className="lh-btn lh-block" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>

        <p style={{ textAlign: "center", marginTop: 18, fontSize: 14 }}>
          <Link to="/forgot-password" style={{ color: "var(--lh-primary)", fontWeight: 600 }}>
            Forgot password?
          </Link>
        </p>
      </form>
    </div>
  );
}
