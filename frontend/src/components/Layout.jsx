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

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="lh-app">
      <aside className="lh-sidebar">
        <div className="lh-brand">
          <span className="lh-logo">⛅</span> Cloud HRMS
        </div>
        <nav className="lh-nav">
          {NAV.filter((i) => i.roles.includes(user.role)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
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
          <div />
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
