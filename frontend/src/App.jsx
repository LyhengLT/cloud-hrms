import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Employees from "./pages/Employees.jsx";
import Departments from "./pages/Departments.jsx";
import Attendance from "./pages/Attendance.jsx";
import Leaves from "./pages/Leaves.jsx";
import Payroll from "./pages/Payroll.jsx";

// Guard: requires login; optionally restricts to roles
function Protected({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="lh-center">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role))
    return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const HR = ["ADMIN", "HR"];
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/employees" element={<Protected roles={HR}><Employees /></Protected>} />
        <Route path="/departments" element={<Departments />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/leaves" element={<Leaves />} />
        <Route path="/payroll" element={<Payroll />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
