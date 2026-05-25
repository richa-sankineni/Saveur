import React from "react";

export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius)",
      padding: "20px 24px",
      ...style,
    }}>{children}</div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
      <div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, color: "var(--text)", lineHeight: 1.2 }}>{title}</h1>
        {subtitle && <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Btn({ children, onClick, variant = "primary", size = "md", disabled = false, style = {} }) {
  const base = {
    border: "none", borderRadius: 8, fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.18s", display: "inline-flex", alignItems: "center", gap: 6, ...style,
    opacity: disabled ? 0.5 : 1,
  };
  const sizes = { sm: { padding: "5px 12px", fontSize: 12 }, md: { padding: "8px 18px", fontSize: 13 }, lg: { padding: "11px 24px", fontSize: 14 } };
  const variants = {
    primary: { background: "var(--gold)", color: "#0f0e0e" },
    secondary: { background: "var(--border)", color: "var(--text)" },
    danger: { background: "transparent", border: "1px solid var(--red)", color: "var(--red)" },
    ghost: { background: "transparent", color: "var(--muted)" },
    success: { background: "rgba(82,201,122,0.15)", color: "var(--green)", border: "1px solid rgba(82,201,122,0.3)" },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...sizes[size], ...variants[variant] }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.filter = "brightness(1.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.filter = ""; }}
    >{children}</button>
  );
}

export function StatusBadge({ status }) {
  const map = {
    received:  { color: "#5299e0", bg: "rgba(82,153,224,0.12)" },
    preparing: { color: "#e0a852", bg: "rgba(224,168,82,0.12)" },
    ready:     { color: "#52c97a", bg: "rgba(82,201,122,0.12)" },
    completed: { color: "#7a756c", bg: "rgba(122,117,108,0.12)" },
    pending:   { color: "#e0a852", bg: "rgba(224,168,82,0.12)" },
    confirmed: { color: "#52c97a", bg: "rgba(82,201,122,0.12)" },
    cancelled: { color: "#e05252", bg: "rgba(224,82,82,0.12)" },
    available: { color: "#52c97a", bg: "rgba(82,201,122,0.12)" },
    occupied:  { color: "#e05252", bg: "rgba(224,82,82,0.12)" },
    reserved:  { color: "#e0a852", bg: "rgba(224,168,82,0.12)" },
    paid:      { color: "#52c97a", bg: "rgba(82,201,122,0.12)" },
  };
  const s = map[status?.toLowerCase()] || { color: "var(--muted)", bg: "var(--border)" };
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 99,
      fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
      color: s.color, background: s.bg,
    }}>{status}</span>
  );
}

export function Input({ label, ...props }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)" }}>{label}</label>}
      <input
        {...props}
        style={{
          background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8,
          padding: "9px 13px", color: "var(--text)", fontSize: 13, outline: "none", width: "100%",
          transition: "border-color 0.2s",
          ...(props.style || {}),
        }}
        onFocus={e => e.target.style.borderColor = "var(--gold)"}
        onBlur={e => e.target.style.borderColor = "var(--border)"}
      />
    </div>
  );
}

export function Select({ label, children, ...props }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)" }}>{label}</label>}
      <select
        {...props}
        style={{
          background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8,
          padding: "9px 13px", color: "var(--text)", fontSize: 13, outline: "none", width: "100%",
          ...(props.style || {}),
        }}
      >{children}</select>
    </div>
  );
}

export function StatCard({ label, value, icon, color = "var(--gold)" }) {
  return (
    <Card style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ fontSize: 28, width: 48, height: 48, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-display)", color }}>{value ?? "—"}</div>
        <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{label}</div>
      </div>
    </Card>
  );
}

export function Empty({ icon = "◎", message }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <p style={{ fontSize: 14 }}>{message}</p>
    </div>
  );
}

let _setToast;
export function ToastContainer() {
  const [toasts, setToasts] = React.useState([]);
  _setToast = (msg, type = "info") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  };
  const colors = { success: "var(--green)", error: "var(--red)", info: "var(--gold)" };
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, display: "flex", flexDirection: "column", gap: 8, zIndex: 999 }}>
      {toasts.map(t => (
        <div key={t.id} className="fade-up" style={{
          background: "var(--surface)", border: `1px solid ${colors[t.type] || colors.info}`,
          borderRadius: 10, padding: "10px 16px", fontSize: 13, color: "var(--text)",
          boxShadow: `0 4px 20px rgba(0,0,0,0.4)`, maxWidth: 320,
          borderLeft: `3px solid ${colors[t.type] || colors.info}`,
        }}>{t.msg}</div>
      ))}
    </div>
  );
}
export const toast = {
  success: (m) => _setToast?.(m, "success"),
  error: (m) => _setToast?.(m, "error"),
  info: (m) => _setToast?.(m, "info"),
};

export function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        border: "2px solid var(--border)", borderTopColor: "var(--gold)",
        animation: "spin 0.7s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function RequireAuth({ roles, children }) {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (!user) return (
    <Card style={{ textAlign: "center", padding: 40 }}>
      <p style={{ color: "var(--muted)", marginBottom: 16 }}>Please sign in to access this page.</p>
      <a href="/login"><Btn>Go to Login</Btn></a>
    </Card>
  );
  if (roles && !roles.includes(user.role)) return (
    <Card style={{ textAlign: "center", padding: 40 }}>
      <p style={{ color: "var(--red)" }}>Access denied — requires role: {roles.join(" or ")}</p>
    </Card>
  );
  return children;
}
