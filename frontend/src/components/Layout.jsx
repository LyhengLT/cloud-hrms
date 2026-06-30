import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const NAV = [
  { to: "/", label: "Dashboard", icon: "▦", roles: ["ADMIN", "HR", "EMPLOYEE"] },
  { to: "/employees", label: "Employees", icon: "☷", roles: ["ADMIN", "HR"] },
  { to: "/departments", label: "Departments", icon: "▤", roles: ["ADMIN", "HR", "EMPLOYEE"] },
  { to: "/attendance", label: "Attendance", icon: "◷", roles: ["ADMIN", "HR", "EMPLOYEE"] },
  { to: "/leaves", label: "Leaves", icon: "✈", roles: ["ADMIN", "HR", "EMPLOYEE"] },
  { to: "/payroll", label: "Payroll", icon: "$", roles: ["ADMIN", "HR", "EMPLOYEE"] },
  { to: "/reports", label: "Reports", icon: "📊", roles: ["ADMIN", "HR"] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="lh-app">
      {/* Mobile overlay behind the drawer */}
      {navOpen && <div className="lh-nav-overlay" onClick={() => setNavOpen(false)} />}

      <aside className={"lh-sidebar" + (navOpen ? " lh-open" : "")}>
        <div className="lh-brand">
          <span className="lh-logo">⛅</span> Cloud HRMS
        </div>
        <nav className="lh-nav">
          {NAV.filter((i) => i.roles.includes(user.role)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => setNavOpen(false)}
              className={({ isActive }) => "lh-nav-item" + (isActive ? " lh-active" : "")}
            >
              <span className="lh-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="lh-main">
        <header className="lh-topbar">
          <button
            className="lh-burger"
            onClick={() => setNavOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
          <div className="lh-brand-mobile">
            <span className="lh-logo" style={{ width: 30, height: 30, fontSize: 17 }}>⛅</span> Cloud HRMS
          </div>
          <div className="lh-user">
            <div className="lh-user-info">
              <strong>{user.full_name}</strong>
              <span className="lh-badge">{user.role}</span>
            </div>
            <button className="lh-btn lh-btn-ghost" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>
        <main className="lh-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
