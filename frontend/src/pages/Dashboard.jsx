import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext.jsx";

function parseUTC(dt) {
  if (!dt) return null;
  const hasTz = /[Zz]|[+-]\d{2}:?\d{2}$/.test(dt);
  return new Date(hasTz ? dt : dt + "Z");
}
const fmtTime = (dt) => {
  const d = parseUTC(dt);
  return d ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
};
function workedText(rec) {
  if (!rec?.check_in) return null;
  const end = rec.check_out ? parseUTC(rec.check_out) : new Date();
  const mins = Math.max(0, Math.round((end - parseUTC(rec.check_in)) / 60000));
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isHR = ["ADMIN", "HR"].includes(user.role);
  const [stats, setStats] = useState({ employees: 0, departments: 0, pendingLeaves: 0, payslips: 0 });

  // Attendance widget state
  const [todayRec, setTodayRec] = useState(null);
  const [clockMsg, setClockMsg] = useState("");
  const [clockErr, setClockErr] = useState("");

  async function loadAttendance() {
    const today = new Date().toISOString().slice(0, 10);
    const mine = await api.myAttendance();
    setTodayRec(mine.find((r) => r.work_date === today) || null);
  }

  async function clock(kind) {
    setClockErr(""); setClockMsg("");
    try {
      await (kind === "in" ? api.checkIn() : api.checkOut());
      setClockMsg(kind === "in" ? "Checked in ✓" : "Checked out ✓");
      loadAttendance();
    } catch (e) { setClockErr(e.message); }
  }

  useEffect(() => {
    async function load() {
      try {
        const departments = await api.listDepartments();
        const next = { departments: departments.length, employees: 0, pendingLeaves: 0, payslips: 0 };
        if (isHR) {
          const [emps, leaves, slips] = await Promise.all([
            api.listEmployees(), api.allLeaves(), api.allPayslips(),
          ]);
          next.employees = emps.length;
          next.pendingLeaves = leaves.filter((l) => l.status === "PENDING").length;
          next.payslips = slips.length;
        } else {
          const [leaves, slips] = await Promise.all([api.myLeaves(), api.myPayslips()]);
          next.pendingLeaves = leaves.filter((l) => l.status === "PENDING").length;
          next.payslips = slips.length;
        }
        setStats(next);
      } catch (e) {
        console.error(e);
      }
    }
    load();
    loadAttendance();
  }, [isHR]);

  const cards = isHR
    ? [
        { num: stats.employees, label: "Total Employees", icon: "👥", to: "/employees" },
        { num: stats.departments, label: "Departments", icon: "🏢", to: "/departments" },
        { num: stats.pendingLeaves, label: "Pending Leave Requests", icon: "✈️", to: "/leaves" },
        { num: stats.payslips, label: "Payslips Issued", icon: "💵", to: "/payroll" },
      ]
    : [
        { num: stats.departments, label: "Departments", icon: "🏢", to: "/departments" },
        { num: stats.pendingLeaves, label: "My Pending Leaves", icon: "✈️", to: "/leaves" },
        { num: stats.payslips, label: "My Payslips", icon: "💵", to: "/payroll" },
      ];

  const actions = isHR
    ? [
        { icon: "➕", title: "Add Employee", desc: "Onboard a new team member", to: "/employees" },
        { icon: "👥", title: "View Employees", desc: "Browse & search staff", to: "/employees" },
        { icon: "🏢", title: "Departments", desc: "Organize teams & units", to: "/departments" },
        { icon: "📊", title: "Reports", desc: "Org-wide analytics", to: "/reports" },
        { icon: "📋", title: "Review Leaves", desc: "Approve or reject requests", to: "/leaves" },
        { icon: "💵", title: "Run Payroll", desc: "Generate monthly payslips", to: "/payroll" },
      ]
    : [
        { icon: "✈️", title: "Request Leave", desc: "Submit a time-off request", to: "/leaves" },
        { icon: "📋", title: "My Leaves", desc: "Track your requests", to: "/leaves" },
        { icon: "💵", title: "My Payslips", desc: "View your salary history", to: "/payroll" },
        { icon: "🕒", title: "Attendance", desc: "View your timeline", to: "/attendance" },
      ];

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const status = !todayRec?.check_in
    ? "Not checked in"
    : todayRec.check_out
      ? `Done for today · ${workedText(todayRec)}`
      : `Working · since ${fmtTime(todayRec.check_in)}`;

  return (
    <div>
      {/* Hero banner */}
      <div className="lh-hero">
        <div>
          <div className="lh-hero-date">{today}</div>
          <h1 className="lh-hero-title">Welcome back, {user.full_name.split(" ")[0]} 👋</h1>
          <p className="lh-hero-sub">
            {isHR
              ? "Here's what's happening across your organization today."
              : "Here's your personal workspace at a glance."}
          </p>
        </div>
        <div className="lh-hero-badge">{user.role}</div>
      </div>

      {/* Check in / out widget */}
      <div className="lh-card lh-clock" style={{ marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--lh-muted)", fontWeight: 700, letterSpacing: ".5px" }}>ATTENDANCE</div>
          <div style={{ fontSize: 19, fontWeight: 700, marginTop: 2 }}>{status}</div>
          {clockErr && <div className="lh-error" style={{ marginTop: 10, marginBottom: 0 }}>{clockErr}</div>}
          {clockMsg && <div style={{ color: "var(--lh-green)", fontWeight: 600, marginTop: 8 }}>{clockMsg}</div>}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="lh-btn lh-btn-green" onClick={() => clock("in")}>Check in</button>
          <button className="lh-btn lh-btn-ghost" onClick={() => clock("out")}>Check out</button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="lh-stat-grid">
        {cards.map((c) => (
          <div className="lh-stat lh-stat-click" key={c.label} onClick={() => navigate(c.to)}>
            <div className="lh-stat-ico">{c.icon}</div>
            <div className="lh-stat-num">{c.num}</div>
            <div className="lh-stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <h3 style={{ margin: "4px 0 14px", fontSize: 16 }}>Quick actions</h3>
      <div className="lh-action-grid">
        {actions.map((a) => (
          <div className="lh-action" key={a.title} onClick={() => navigate(a.to)}>
            <div className="lh-action-ico">{a.icon}</div>
            <div>
              <div className="lh-action-title">{a.title}</div>
              <div className="lh-action-desc">{a.desc}</div>
            </div>
            <div className="lh-action-arrow">→</div>
          </div>
        ))}
      </div>
    </div>
  );
}
