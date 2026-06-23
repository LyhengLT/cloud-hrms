import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext.jsx";

const EMPTY = {
  full_name: "", email: "", phone: "", position: "",
  base_salary: 0, department_id: "", role: "EMPLOYEE", password: "",
};

export default function Employees() {
  const { user } = useAuth();
  const isAdmin = user.role === "ADMIN";
  const [rows, setRows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(null); // null | {mode, data}
  const [error, setError] = useState("");

  async function load() {
    setRows(await api.listEmployees(q));
  }
  useEffect(() => { load(); }, [q]);
  useEffect(() => { api.listDepartments().then(setDepartments); }, []);

  function openCreate() { setError(""); setModal({ mode: "create", data: { ...EMPTY } }); }
  function openEdit(emp) {
    setError("");
    setModal({ mode: "edit", data: {
      ...emp, password: "", department_id: emp.department_id || "",
    }});
  }

  async function save() {
    setError("");
    const d = modal.data;
    const payload = {
      full_name: d.full_name, phone: d.phone, position: d.position,
      base_salary: Number(d.base_salary) || 0,
      department_id: d.department_id ? Number(d.department_id) : null,
      role: d.role,
    };
    try {
      if (modal.mode === "create") {
        await api.createEmployee({ ...payload, email: d.email, password: d.password });
      } else {
        if (d.password) payload.password = d.password;
        await api.updateEmployee(d.id, payload);
      }
      setModal(null);
      load();
    } catch (e) { setError(e.message); }
  }

  async function remove(emp) {
    if (!confirm(`Delete ${emp.full_name}?`)) return;
    try { await api.deleteEmployee(emp.id); load(); }
    catch (e) { alert(e.message); }
  }

  return (
    <div>
      <h1 className="lh-page-title">Employees</h1>
      <p className="lh-page-sub">Manage your organization's people.</p>

      <div className="lh-toolbar">
        <input className="lh-input" style={{ maxWidth: 280 }} placeholder="Search name or email…"
          value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="lh-btn" onClick={openCreate}>+ Add Employee</button>
      </div>

      <div className="lh-table-wrap">
        <table className="lh-table">
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Position</th>
              <th>Department</th><th>Role</th><th>Salary</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id}>
                <td>{e.full_name}</td>
                <td>{e.email}</td>
                <td>{e.position || "—"}</td>
                <td>{e.department_name || "—"}</td>
                <td><span className="lh-badge">{e.role}</span></td>
                <td>${e.base_salary.toLocaleString()}</td>
                <td style={{ whiteSpace: "nowrap", textAlign: "right" }}>
                  {/* HR can edit regular employees; only Admin edits HR/Admin accounts */}
                  {(isAdmin || e.role === "EMPLOYEE") && (
                    <button className="lh-btn lh-btn-ghost lh-btn-sm" onClick={() => openEdit(e)}>Edit</button>
                  )}{" "}
                  {/* Delete is Admin-only */}
                  {isAdmin && e.id !== user.id && (
                    <button className="lh-btn lh-btn-danger lh-btn-sm" onClick={() => remove(e)}>Delete</button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan="7" className="lh-empty">No employees found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="lh-overlay" onClick={() => setModal(null)}>
          <div className="lh-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{modal.mode === "create" ? "Add Employee" : "Edit Employee"}</h3>
            {error && <div className="lh-error">{error}</div>}

            <div className="lh-field">
              <label>Full name</label>
              <input className="lh-input" value={modal.data.full_name}
                onChange={(e) => setModal({ ...modal, data: { ...modal.data, full_name: e.target.value } })} />
            </div>
            <div className="lh-field">
              <label>Email</label>
              <input className="lh-input" type="email" value={modal.data.email}
                disabled={modal.mode === "edit"}
                onChange={(e) => setModal({ ...modal, data: { ...modal.data, email: e.target.value } })} />
            </div>
            <div className="lh-row">
              <div className="lh-field">
                <label>Position</label>
                <input className="lh-input" value={modal.data.position}
                  onChange={(e) => setModal({ ...modal, data: { ...modal.data, position: e.target.value } })} />
              </div>
              <div className="lh-field">
                <label>Phone</label>
                <input className="lh-input" value={modal.data.phone}
                  onChange={(e) => setModal({ ...modal, data: { ...modal.data, phone: e.target.value } })} />
              </div>
            </div>
            <div className="lh-row">
              <div className="lh-field">
                <label>Department</label>
                <select className="lh-select" value={modal.data.department_id}
                  onChange={(e) => setModal({ ...modal, data: { ...modal.data, department_id: e.target.value } })}>
                  <option value="">— none —</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="lh-field">
                <label>Role</label>
                <select className="lh-select" value={modal.data.role} disabled={!isAdmin}
                  onChange={(e) => setModal({ ...modal, data: { ...modal.data, role: e.target.value } })}>
                  <option value="EMPLOYEE">EMPLOYEE</option>
                  {/* Only Admin may assign elevated roles */}
                  {isAdmin && <option value="HR">HR</option>}
                  {isAdmin && <option value="ADMIN">ADMIN</option>}
                </select>
              </div>
            </div>
            <div className="lh-row">
              <div className="lh-field">
                <label>Base salary (USD)</label>
                <input className="lh-input" type="number" value={modal.data.base_salary}
                  onChange={(e) => setModal({ ...modal, data: { ...modal.data, base_salary: e.target.value } })} />
              </div>
              <div className="lh-field">
                <label>{modal.mode === "create" ? "Password" : "New password (optional)"}</label>
                <input className="lh-input" type="password" value={modal.data.password}
                  onChange={(e) => setModal({ ...modal, data: { ...modal.data, password: e.target.value } })} />
              </div>
            </div>

            <div className="lh-modal-actions">
              <button className="lh-btn lh-btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="lh-btn" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
