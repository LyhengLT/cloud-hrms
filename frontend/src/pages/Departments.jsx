import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext.jsx";
import { Chip, PageHeader } from "../components/ui.jsx";

const DEPT_ICONS = ["🏢", "💻", "👔", "📈", "🎯", "🛠️", "🎨", "📦"];

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

  const totalStaff = rows.reduce((a, d) => a + d.employee_count, 0);

  return (
    <div>
      <PageHeader icon="🏢" title="Departments" sub="Organizational units and headcount.">
        {isHR && <button className="lh-btn" onClick={openCreate}>+ Add Department</button>}
      </PageHeader>

      <div className="lh-chips">
        <Chip label="Departments" value={rows.length} />
        <Chip label="Total staff" value={totalStaff} color="#06b6d4" />
      </div>

      <div className="lh-dept-grid">
        {rows.map((d, i) => (
          <div className="lh-dept-card" key={d.id} style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="lh-dept-ico">{DEPT_ICONS[i % DEPT_ICONS.length]}</div>
            <div className="lh-dept-name">{d.name}</div>
            <div className="lh-dept-desc">{d.description || "No description"}</div>
            <div className="lh-dept-foot">
              <div>
                <span className="lh-dept-count">{d.employee_count}</span>
                <span style={{ color: "var(--lh-muted)", fontSize: 13, marginLeft: 6 }}>
                  {d.employee_count === 1 ? "member" : "members"}
                </span>
              </div>
              {isHR && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="lh-btn lh-btn-ghost lh-btn-sm" onClick={() => openEdit(d)}>Edit</button>
                  {isAdmin && (
                    <button className="lh-btn lh-btn-danger lh-btn-sm" onClick={() => remove(d)}>Delete</button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="lh-empty">No departments yet.</p>}
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
