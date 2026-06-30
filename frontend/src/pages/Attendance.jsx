import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext.jsx";
import { PageHeader } from "../components/ui.jsx";

// Backend sends naive UTC timestamps (no timezone). Parse them as UTC so the
// browser converts to the viewer's local time correctly.
function parseUTC(dt) {
  if (!dt) return null;
  const hasTz = /[Zz]|[+-]\d{2}:?\d{2}$/.test(dt);
  return new Date(hasTz ? dt : dt + "Z");
}

const fmtTime = (dt) => {
  const d = parseUTC(dt);
  return d ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
};

const fmtDay = (d) =>
  new Date(d + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

function duration(a) {
  if (!a.check_in) return null;
  const end = a.check_out ? parseUTC(a.check_out) : new Date();
  const mins = Math.max(0, Math.round((end - parseUTC(a.check_in)) / 60000));
  const h = Math.floor(mins / 60), m = mins % 60;
  return { text: `${h}h ${m}m`, open: !a.check_out };
}

export default function Attendance() {
  const { user } = useAuth();
  const isHR = ["ADMIN", "HR"].includes(user.role);
  const [mine, setMine] = useState([]);
  const [all, setAll] = useState([]);

  async function load() {
    setMine(await api.myAttendance());
    if (isHR) setAll(await api.allAttendance());
  }
  useEffect(() => { load(); }, []);

  return (
    <div>
      <PageHeader icon="🕒" title="Attendance" sub="Your attendance timeline. Check in / out from the Dashboard." />

      {/* Personal timeline — everyone */}
      <div className="lh-card" style={{ marginBottom: isHR ? 26 : 0 }}>
        <h3 style={{ marginTop: 0 }}>Your timeline</h3>
        {mine.length === 0 && <p className="lh-empty">No attendance records yet. Check in to start.</p>}
        <div className="lh-timeline">
          {mine.map((a) => {
            const d = duration(a);
            return (
              <div className="lh-tl-item" key={a.id}>
                <div className={"lh-tl-dot" + (d?.open ? " lh-tl-live" : "")} />
                <div className="lh-tl-body">
                  <div className="lh-tl-day">{fmtDay(a.work_date)}</div>
                  <div className="lh-tl-times">
                    <span>🟢 In&nbsp;<strong>{fmtTime(a.check_in)}</strong></span>
                    <span>🔴 Out&nbsp;<strong>{fmtTime(a.check_out)}</strong></span>
                    {d && (
                      <span className={"lh-pill " + (d.open ? "PENDING" : "APPROVED")}>
                        {d.open ? "In progress · " + d.text : d.text}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* All-staff overview — HR/Admin only */}
      {isHR && (
        <>
          <h3 style={{ margin: "4px 0 14px", fontSize: 16 }}>All staff attendance</h3>
          <div className="lh-table-wrap">
            <table className="lh-table">
              <thead>
                <tr><th>Employee</th><th>Date</th><th>Check in</th><th>Check out</th><th>Hours</th></tr>
              </thead>
              <tbody>
                {all.map((a) => {
                  const d = duration(a);
                  return (
                    <tr key={a.id}>
                      <td>{a.employee_name}</td>
                      <td>{a.work_date}</td>
                      <td>{fmtTime(a.check_in)}</td>
                      <td>{fmtTime(a.check_out)}</td>
                      <td>{d ? (d.open ? "—" : d.text) : "—"}</td>
                    </tr>
                  );
                })}
                {all.length === 0 && (
                  <tr><td colSpan="5" className="lh-empty">No attendance records yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
