import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext.jsx";

export default function Departments() {
  const { user } = useAuth();
  const isHR = ["ADMIN", "HR"].includes(user.role);
  const isAdmin = user.role === "ADMIN";
  const [rows, setRows] = useState([]);
  const [modal, setModal] = useState(null);
  const [error, setError] = useState("");

  async function load() { setRows(await api.listDepartments()); }
  useEffect(() => { load(); }, []);

  function openCreate() { setError(""); setModal({ mode: "create", data: { name: "", description: "" } }); }
  function openEdit(d) { setError(""); setModal({ mode: "edit", data: { ...d } }); }

  async function save() {
    setError("");
    const { name, description } = modal.data;
    try {
      if (modal.mode === "create") await api.createDepartment({ name, description });
      else await api.updateDepartment(modal.data.id, { name, description });
      setModal(null); load();
    } catch (e) { setError(e.message); }
  }

  async function remove(d) {
    if (!confirm(`Delete ${d.name}?`)) return;
    try { await api.deleteDepartment(d.id); load(); }
    catch (e) { alert(e.message); }
  }

  return (
    <div>
      <h1 className="lh-page-title">Departments</h1>
      <p className="lh-page-sub">Organizational units and headcount.</p>

      {isHR && (
        <div className="lh-toolbar">
          <div />
          <button className="lh-btn" onClick={openCreate}>+ Add Department</button>
        </div>
      )}

      <div className="lh-table-wrap">
        <table className="lh-table">
          <thead>
            <tr><th>Name</th><th>Description</th><th>Employees</th>{isHR && <th></th>}</tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id}>
                <td><strong>{d.name}</strong></td>
                <td>{d.description || "—"}</td>
                <td>{d.employee_count}</td>
                {isHR && (
                  <td style={{ whiteSpace: "nowrap", textAlign: "right" }}>
                    <button className="lh-btn lh-btn-ghost lh-btn-sm" onClick={() => openEdit(d)}>Edit</button>{" "}
                    {/* Delete is Admin-only */}
                    {isAdmin && (
                      <button className="lh-btn lh-btn-danger lh-btn-sm" onClick={() => remove(d)}>Delete</button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={isHR ? 4 : 3} className="lh-empty">No departments yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="lh-overlay" onClick={() => setModal(null)}>
          <div className="lh-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{modal.mode === "create" ? "Add Department" : "Edit Department"}</h3>
            {error && <div className="lh-error">{error}</div>}
            <div className="lh-field">
              <label>Name</label>
              <input className="lh-input" value={modal.data.name}
                onChange={(e) => setModal({ ...modal, data: { ...modal.data, name: e.target.value } })} />
            </div>
            <div className="lh-field">
              <label>Description</label>
              <input className="lh-input" value={modal.data.description}
                onChange={(e) => setModal({ ...modal, data: { ...modal.data, description: e.target.value } })} />
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
