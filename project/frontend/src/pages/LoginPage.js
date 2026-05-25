import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { setAuth } from "../api";
import { Btn, Input, toast, ToastContainer } from "../components";

export default function LoginPage() {
  const [mode, setMode] = useState("login"); 
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "customer" });
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const payload = mode === "login"
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password, role: form.role };
      const res = await api.post(endpoint, payload);
      const { token, user } = res.data.data;
      setAuth(token, user);
      window.dispatchEvent(new Event("auth-change"));
      toast.success(`Welcome, ${user.name}!`);
      setTimeout(() => nav("/"), 600);
    } catch (err) {
      toast.error(err.response?.data?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const demoCredentials = [
    { label: "Admin", email: "admin@restaurant.com", password: "admin123" },
    { label: "Chef", email: "chef@restaurant.com", password: "chef123" },
    { label: "Waiter", email: "waiter@restaurant.com", password: "waiter123" },
    { label: "Customer", email: "alice@email.com", password: "alice123" },
  ];

  return (
    <>
      <ToastContainer />
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="fade-up" style={{ width: "100%", maxWidth: 420 }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 40, color: "var(--gold)", fontWeight: 900, letterSpacing: "-0.02em" }}>◈ Saveur</div>
            <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 6 }}>Restaurant Management System</p>
          </div>

          
          <div style={{ display: "flex", background: "var(--surface)", borderRadius: 10, padding: 4, marginBottom: 24, border: "1px solid var(--border)" }}>
            {["login", "register"].map((m) => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: "8px", borderRadius: 7, border: "none", fontFamily: "var(--font-body)",
                fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", textTransform: "capitalize",
                background: mode === m ? "var(--gold)" : "transparent",
                color: mode === m ? "#0f0e0e" : "var(--muted)",
              }}>{m}</button>
            ))}
          </div>

          
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 28, display: "flex", flexDirection: "column", gap: 16 }}>
            {mode === "register" && (
              <Input label="Full Name" placeholder="Jane Doe" value={form.name} onChange={set("name")} />
            )}
            <Input label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} />
            <Input label="Password" type="password" placeholder="••••••••" value={form.password} onChange={set("password")} />
            {mode === "register" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)" }}>Role</label>
                <select value={form.role} onChange={set("role")} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 13px", color: "var(--text)", fontSize: 13, outline: "none" }}>
                  <option value="customer">Customer</option>
                  <option value="waiter">Waiter</option>
                  <option value="chef">Chef</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}
            <Btn onClick={submit} disabled={loading} size="lg" style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
              {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </Btn>
          </div>

         
          {mode === "login" && (
            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Quick demo login</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {demoCredentials.map((d) => (
                  <button key={d.label} onClick={() => { setForm(p => ({ ...p, email: d.email, password: d.password })); }} style={{
                    background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8,
                    padding: "8px", fontSize: 12, color: "var(--text)", cursor: "pointer",
                    transition: "border-color 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--gold)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
                  >
                    <div style={{ fontWeight: 600, color: "var(--gold)" }}>{d.label}</div>
                    <div style={{ color: "var(--muted)", fontSize: 11, marginTop: 2 }}>{d.email}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
