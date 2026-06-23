import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext.jsx";

function fmt(dt) {
  return dt ? new Date(dt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
}

export default function Attendance() {
  const { user } = useAuth();
  const isHR = ["ADMIN", "HR"].includes(user.role);
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setRows(isHR ? await api.allAttendance() : await api.myAttendance());
  }
  useEffect(() => { load(); }, []);

  async function clock(kind) {
    setError(""); setMsg("");
    try {
      await (kind === "in" ? api.checkIn() : api.checkOut());
      setMsg(kind === "in" ? "Checked in ✓" : "Checked out ✓");
      load();
    } catch (e) { setError(e.message); }
  }

  return (
    <div>
      <h1 className="lh-page-title">Attendance</h1>
      <p className="lh-page-sub">{isHR ? "All employee attendance records." : "Clock in and out, and view your history."}</p>

      {!isHR && (
        <div className="lh-card" style={{ marginBottom: 20 }}>
          {error && <div className="lh-error">{error}</div>}
          {msg && <p style={{ color: "var(--lh-green)", margin: "0 0 12px" }}>{msg}</p>}
          <div className="lh-row">
            <button className="lh-btn lh-btn-green" onClick={() => clock("in")}>Check in</button>
            <button className="lh-btn lh-btn-ghost" onClick={() => clock("out")}>Check out</button>
          </div>
        </div>
      )}

      <div className="lh-table-wrap">
        <table className="lh-table">
          <thead>
            <tr>{isHR && <th>Employee</th>}<th>Date</th><th>Check in</th><th>Check out</th></tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                {isHR && <td>{a.employee_name}</td>}
                <td>{a.work_date}</td>
                <td>{fmt(a.check_in)}</td>
                <td>{fmt(a.check_out)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={isHR ? 4 : 3} className="lh-empty">No attendance records yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
