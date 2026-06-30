import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext.jsx";
import { Chip, PageHeader } from "../components/ui.jsx";

const thisMonth = new Date().toISOString().slice(0, 7);
const money = (n) => "$" + Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

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

  async function downloadPdf(id) {
    try { await api.payslipPdf(id); }
    catch (e) { alert(e.message); }
  }
  async function exportExcel() {
    try { await api.exportPayrollExcel(); }
    catch (e) { alert(e.message); }
  }

  const totalNet = rows.reduce((a, p) => a + p.net_pay, 0);

  return (
    <div>
      <PageHeader icon="💵" title="Payroll"
        sub={isHR ? "Generate and review payslips." : "Your payslip history."}>
        <button className="lh-btn lh-btn-green" onClick={exportExcel} disabled={rows.length === 0}>
          ⬇ Export Excel
        </button>
      </PageHeader>

      <div className="lh-chips">
        <Chip label="Payslips" value={rows.length} />
        <Chip label={isHR ? "Total paid" : "My total"} value={money(totalNet)} color="#16a34a" />
      </div>

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
              <th>Period</th><th>Base</th><th>Allowances</th><th>Deductions</th><th>Net pay</th><th></th>
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
                <td style={{ textAlign: "right" }}>
                  <button className="lh-btn lh-btn-ghost lh-btn-sm" onClick={() => downloadPdf(p.id)}>
                    📄 PDF
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={isHR ? 7 : 6} className="lh-empty">No payslips yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
