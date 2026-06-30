import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext.jsx";
import { Chip, PageHeader } from "../components/ui.jsx";

const today = new Date().toISOString().slice(0, 10);

export default function Leaves() {
  const { user } = useAuth();
  const isHR = ["ADMIN", "HR"].includes(user.role);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ leave_type: "Annual", start_date: today, end_date: today, reason: "" });
  const [error, setError] = useState("");

  async function load() {
    setRows(isHR ? await api.allLeaves() : await api.myLeaves());
  }
  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.requestLeave(form);
      setForm({ leave_type: "Annual", start_date: today, end_date: today, reason: "" });
      load();
    } catch (err) { setError(err.message); }
  }

  async function review(id, status) {
    try { await api.reviewLeave(id, status); load(); }
    catch (e) { alert(e.message); }
  }

  const c = {
    pending: rows.filter((l) => l.status === "PENDING").length,
    approved: rows.filter((l) => l.status === "APPROVED").length,
    rejected: rows.filter((l) => l.status === "REJECTED").length,
  };

  return (
    <div>
      <PageHeader icon="✈️" title="Leave Requests"
        sub={isHR ? "Review and approve time-off requests." : "Request time off and track status."} />

      <div className="lh-chips">
        <Chip label="Pending" value={c.pending} color="#d97706" />
        <Chip label="Approved" value={c.approved} color="#16a34a" />
        <Chip label="Rejected" value={c.rejected} color="#dc2626" />
      </div>

      {!isHR && (
        <form className="lh-card" style={{ marginBottom: 20 }} onSubmit={submit}>
          <h3 style={{ marginTop: 0 }}>New request</h3>
          {error && <div className="lh-error">{error}</div>}
          <div className="lh-row">
            <div className="lh-field">
              <label>Type</label>
              <select className="lh-select" value={form.leave_type}
                onChange={(e) => setForm({ ...form, leave_type: e.target.value })}>
                <option>Annual</option><option>Sick</option><option>Unpaid</option><option>Other</option>
              </select>
            </div>
            <div className="lh-field">
              <label>From</label>
              <input className="lh-input" type="date" value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div className="lh-field">
              <label>To</label>
              <input className="lh-input" type="date" value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>
          <div className="lh-field">
            <label>Reason</label>
            <input className="lh-input" value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
          <div className="lh-modal-actions">
            <button className="lh-btn" type="submit">Submit request</button>
          </div>
        </form>
      )}

      <div className="lh-table-wrap">
        <table className="lh-table">
          <thead>
            <tr>
              {isHR && <th>Employee</th>}
              <th>Type</th><th>From</th><th>To</th><th>Reason</th><th>Status</th>{isHR && <th></th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.id}>
                {isHR && <td>{l.employee_name}</td>}
                <td>{l.leave_type}</td>
                <td>{l.start_date}</td>
                <td>{l.end_date}</td>
                <td>{l.reason || "—"}</td>
                <td><span className={`lh-pill ${l.status}`}>{l.status}</span></td>
                {isHR && (
                  <td style={{ whiteSpace: "nowrap", textAlign: "right" }}>
                    {l.status === "PENDING" ? (
                      <>
                        <button className="lh-btn lh-btn-green lh-btn-sm" onClick={() => review(l.id, "APPROVED")}>Approve</button>{" "}
                        <button className="lh-btn lh-btn-danger lh-btn-sm" onClick={() => review(l.id, "REJECTED")}>Reject</button>
                      </>
                    ) : "—"}
                  </td>
                )}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={isHR ? 7 : 5} className="lh-empty">No leave requests.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
