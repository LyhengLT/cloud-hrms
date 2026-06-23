import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  const isHR = ["ADMIN", "HR"].includes(user.role);
  const [stats, setStats] = useState({ employees: 0, departments: 0, pendingLeaves: 0, payslips: 0 });

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
  }, [isHR]);

  const cards = isHR
    ? [
        { num: stats.employees, label: "Total Employees" },
        { num: stats.departments, label: "Departments" },
        { num: stats.pendingLeaves, label: "Pending Leave Requests" },
        { num: stats.payslips, label: "Payslips Issued" },
      ]
    : [
        { num: stats.departments, label: "Departments" },
        { num: stats.pendingLeaves, label: "My Pending Leaves" },
        { num: stats.payslips, label: "My Payslips" },
      ];

  return (
    <div>
      <h1 className="lh-page-title">Welcome back, {user.full_name.split(" ")[0]} 👋</h1>
      <p className="lh-page-sub">Here's an overview of your workspace.</p>

      <div className="lh-stat-grid">
        {cards.map((c) => (
          <div className="lh-stat" key={c.label}>
            <div className="lh-stat-num">{c.num}</div>
            <div className="lh-stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="lh-card">
        <h3 style={{ marginTop: 0 }}>Quick guide</h3>
        <p style={{ color: "var(--lh-muted)", lineHeight: 1.7, margin: 0 }}>
          {isHR
            ? "As HR/Admin you can manage employees and departments, review leave requests, record attendance, and generate payslips from the sidebar."
            : "Use the sidebar to clock in/out under Attendance, request time off under Leaves, and view your payslips under Payroll."}
        </p>
      </div>
    </div>
  );
}
