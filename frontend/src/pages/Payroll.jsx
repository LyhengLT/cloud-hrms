import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext.jsx";

const thisMonth = new Date().toISOString().slice(0, 7);

export default function Payroll() {
  const { user } = useAuth();
  const isHR = ["ADMIN", "HR"].includes(user.role);
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ employee_id: "", period: thisMonth, allowances: 0, deductions: 0 });
  const [error, setError] = useState("");

  async function load() {
    setRows(isHR ? await api.allPayslips() : await api.myPayslips());
  }
  useEffect(() => { load(); }, []);
  useEffect(() => { if (isHR) api.listEmployees().then(setEmployees); }, [isHR]);

  async function generate(e) {
    e.preventDefault();
    setError("");
    try {
      await api.generatePayslip({
        employee_id: Number(form.employee_id),
        period: form.period,
        allowances: Number(form.allowances) || 0,
        deductions: Number(form.deductions) || 0,
      });
      setForm({ employee_id: "", period: thisMonth, allowances: 0, deductions: 0 });
      load();
    } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <h1 className="lh-page-title">Payroll</h1>
      <p className="lh-page-sub">{isHR ? "Generate and review payslips." : "Your payslip history."}</p>

      {isHR && (
        <form className="lh-card" style={{ marginBottom: 20 }} onSubmit={generate}>
          <h3 style={{ marginTop: 0 }}>Generate payslip</h3>
          {error && <div className="lh-error">{error}</div>}
          <div className="lh-row">
            <div className="lh-field">
              <label>Employee</label>
              <select className="lh-select" value={form.employee_id} required
                onChange={(e) => setForm({ ...form, employee_id: e.target.value })}>
                <option value="">— select —</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.full_name} (${e.base_salary})</option>
                ))}
              </select>
            </div>
            <div className="lh-field">
              <label>Period (YYYY-MM)</label>
              <input className="lh-input" type="month" value={form.period}
                onChange={(e) => setForm({ ...form, period: e.target.value })} />
            </div>
            <div className="lh-field">
              <label>Allowances</label>
              <input className="lh-input" type="number" value={form.allowances}
                onChange={(e) => setForm({ ...form, allowances: e.target.value })} />
            </div>
            <div className="lh-field">
              <label>Deductions</label>
              <input className="lh-input" type="number" value={form.deductions}
                onChange={(e) => setForm({ ...form, deductions: e.target.value })} />
            </div>
          </div>
          <div className="lh-modal-actions">
            <button className="lh-btn" type="submit">Generate</button>
          </div>
        </form>
      )}

      <div className="lh-table-wrap">
        <table className="lh-table">
          <thead>
            <tr>
              {isHR && <th>Employee</th>}
              <th>Period</th><th>Base</th><th>Allowances</th><th>Deductions</th><th>Net pay</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                {isHR && <td>{p.employee_name}</td>}
                <td>{p.period}</td>
                <td>${p.base_salary.toLocaleString()}</td>
                <td>${p.allowances.toLocaleString()}</td>
                <td>${p.deductions.toLocaleString()}</td>
                <td><strong>${p.net_pay.toLocaleString()}</strong></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={isHR ? 6 : 5} className="lh-empty">No payslips yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
