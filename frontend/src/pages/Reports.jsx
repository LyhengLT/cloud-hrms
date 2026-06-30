import { useEffect, useState } from "react";
import { api } from "../api";
import { Donut, PageHeader } from "../components/ui.jsx";

const money = (n) => "$" + Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

function Bar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span style={{ color: "var(--lh-muted)" }}>{value}</span>
      </div>
      <div style={{ height: 10, background: "#eef2f9", borderRadius: 6, overflow: "hidden" }}>
        <div className="lh-bar-fill" style={{ width: pct + "%", height: "100%", background: color, borderRadius: 6 }} />
      </div>
    </div>
  );
}

export default function Reports() {
  const [s, setS] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.stats().then(setS).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="lh-error">{error}</div>;
  if (!s) return <p className="lh-page-sub">Loading reports…</p>;

  const deptMax = Math.max(1, ...s.departments.map((d) => d.count));
  const top = [
    { num: s.employees, label: "Total Employees", icon: "👥" },
    { num: s.active_employees, label: "Active", icon: "✅" },
    { num: money(s.payroll_total), label: "Payroll Paid (all time)", icon: "💵" },
    { num: money(s.avg_base_salary), label: "Avg Base Salary", icon: "📊" },
  ];

  const roleData = [
    { label: "Admin", value: s.roles.ADMIN, color: "#7c3aed" },
    { label: "HR", value: s.roles.HR, color: "#0891b2" },
    { label: "Employee", value: s.roles.EMPLOYEE, color: "#4f46e5" },
  ];

  return (
    <div>
      <PageHeader icon="📊" title="Reports & Analytics" sub={`Organization-wide insights for ${s.month}.`} />

      <div className="lh-stat-grid">
        {top.map((c) => (
          <div className="lh-stat" key={c.label}>
            <div className="lh-stat-ico">{c.icon}</div>
            <div className="lh-stat-num">{c.num}</div>
            <div className="lh-stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px,1fr))", gap: 18 }}>
        <div className="lh-card">
          <h3 style={{ marginTop: 0 }}>Staff by role</h3>
          <Donut data={roleData} />
        </div>

        <div className="lh-card">
          <h3 style={{ marginTop: 0 }}>Headcount by department</h3>
          {s.departments.length === 0 && <p className="lh-empty">No departments yet.</p>}
          {s.departments.map((d) => (
            <Bar key={d.name} label={d.name} value={d.count} max={deptMax} color="var(--lh-grad)" />
          ))}
        </div>

        <div className="lh-card">
          <h3 style={{ marginTop: 0 }}>Leave requests</h3>
          <div style={{ display: "flex", gap: 12 }}>
            {[
              ["Pending", s.leaves.PENDING, "#d97706", "#fef3c7"],
              ["Approved", s.leaves.APPROVED, "#16a34a", "#dcfce7"],
              ["Rejected", s.leaves.REJECTED, "#dc2626", "#fee2e2"],
            ].map(([lbl, val, fg, bg]) => (
              <div key={lbl} style={{ flex: 1, background: bg, borderRadius: 12, padding: "16px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: fg }}>{val}</div>
                <div style={{ fontSize: 12, color: fg, fontWeight: 600 }}>{lbl}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--lh-border)" }}>
            <div style={{ fontSize: 13, color: "var(--lh-muted)", fontWeight: 600 }}>Payroll this month</div>
            <div style={{ fontSize: 26, fontWeight: 800, background: "var(--lh-grad)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", display: "inline-block" }}>
              {money(s.payroll_this_month)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
