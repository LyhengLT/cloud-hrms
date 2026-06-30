// Shared modern UI building blocks

const AVATAR_COLORS = [
  "linear-gradient(135deg,#4f46e5,#6366f1)",
  "linear-gradient(135deg,#0891b2,#06b6d4)",
  "linear-gradient(135deg,#7c3aed,#a855f7)",
  "linear-gradient(135deg,#db2777,#ec4899)",
  "linear-gradient(135deg,#ea580c,#f97316)",
  "linear-gradient(135deg,#16a34a,#22c55e)",
  "linear-gradient(135deg,#0d9488,#14b8a6)",
];

export function Avatar({ name = "?", size = 38 }) {
  const initials = name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  const idx = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return (
    <div
      className="lh-avatar"
      style={{ width: size, height: size, background: AVATAR_COLORS[idx], fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );
}

export function PageHeader({ icon, title, sub, children }) {
  return (
    <div className="lh-phead">
      <div className="lh-phead-ico">{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 className="lh-page-title" style={{ margin: 0 }}>{title}</h1>
        <p className="lh-page-sub" style={{ margin: "2px 0 0" }}>{sub}</p>
      </div>
      {children && <div className="lh-phead-actions">{children}</div>}
    </div>
  );
}

export function Chip({ label, value, color = "var(--lh-primary)", tint = "#eef2ff" }) {
  return (
    <div className="lh-chip">
      <span className="lh-chip-dot" style={{ background: color }} />
      <span className="lh-chip-val" style={{ color }}>{value}</span>
      <span className="lh-chip-label">{label}</span>
    </div>
  );
}

// SVG donut chart. data: [{ label, value, color }]
export function Donut({ data, size = 168, thickness = 20 }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  const r = (size - thickness) / 2 - 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const cx = size / 2;

  return (
    <div style={{ display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${cx} ${cx})`}>
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="#eef2f9" strokeWidth={thickness} />
          {total > 0 && data.map((d, i) => {
            const dash = (d.value / total) * c;
            const seg = (
              <circle
                key={i} cx={cx} cy={cx} r={r} fill="none" stroke={d.color} strokeWidth={thickness}
                strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-offset}
                strokeLinecap="butt"
                style={{ transition: "stroke-dasharray .9s ease" }}
              />
            );
            offset += dash;
            return seg;
          })}
        </g>
        <text x={cx} y={cx - 4} textAnchor="middle" fontSize="30" fontWeight="800" fill="#16263d">{total}</text>
        <text x={cx} y={cx + 18} textAnchor="middle" fontSize="12" fill="#64748b">total</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {data.map((d) => (
          <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14 }}>
            <span style={{ width: 12, height: 12, borderRadius: 4, background: d.color }} />
            <strong>{d.value}</strong>
            <span style={{ color: "var(--lh-muted)" }}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
