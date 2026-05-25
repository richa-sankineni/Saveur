import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import MenuPage from "./pages/MenuPage";
import OrderPage from "./pages/OrderPage";
import KitchenDashboard from "./pages/KitchenDashboard";
import WaiterDashboard from "./pages/WaiterDashboard";
import ReservationPage from "./pages/ReservationPage";
import AdminDashboard from "./pages/AdminDashboard";
import LoginPage from "./pages/LoginPage";
import { getUser, clearAuth } from "./api";

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:       #0f0e0e;
    --surface:  #1a1917;
    --border:   #2e2c29;
    --gold:     #c9a84c;
    --gold-lt:  #e6c97a;
    --red:      #e05252;
    --green:    #52c97a;
    --blue:     #5299e0;
    --text:     #f0ece4;
    --muted:    #7a756c;
    --radius:   12px;
    --font-display: 'Playfair Display', serif;
    --font-body:    'DM Sans', sans-serif;
  }

  html, body, #root {
    height: 100%;
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-body);
    font-size: 15px;
    line-height: 1.6;
  }

  a { color: inherit; text-decoration: none; }
  button { cursor: pointer; font-family: var(--font-body); }
  input, select, textarea { font-family: var(--font-body); }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--surface); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.5; }
  }
  .fade-up { animation: fadeUp 0.4s ease both; }
`;

function NavLink({ to, label, role, allowed }) {
  const loc = useLocation();
  const active = loc.pathname === to;
  if (allowed && !allowed.includes(role)) return null;
  return (
    <Link to={to} style={{
      padding: "6px 14px",
      borderRadius: "6px",
      fontSize: "13px",
      fontWeight: 500,
      letterSpacing: "0.02em",
      color: active ? "#0f0e0e" : "var(--muted)",
      background: active ? "var(--gold)" : "transparent",
      transition: "all 0.2s",
    }}>{label}</Link>
  );
}

function Shell({ children }) {
  const [user, setUser] = useState(getUser());

  useEffect(() => {
    const onStorage = () => setUser(getUser());
    window.addEventListener("storage", onStorage);
    window.addEventListener("auth-change", onStorage);
    return () => { window.removeEventListener("storage", onStorage); window.removeEventListener("auth-change", onStorage); };
  }, []);

  const logout = () => {
    clearAuth();
    setUser(null);
    window.dispatchEvent(new Event("auth-change"));
  };

  const role = user?.role;

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <header style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          padding: "0 24px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--gold)", fontWeight: 700, letterSpacing: "-0.01em" }}>
              ◈ Saveur
            </span>
            <nav style={{ display: "flex", gap: 4 }}>
              <NavLink to="/" label="Menu" role={role} />
              <NavLink to="/order" label="Order" role={role} allowed={["customer","waiter","admin"]} />
              <NavLink to="/kitchen" label="Kitchen" role={role} allowed={["chef","admin"]} />
              <NavLink to="/waiter" label="Waiter" role={role} allowed={["waiter","admin"]} />
              <NavLink to="/reservation" label="Reservations" role={role} allowed={["customer","waiter","admin"]} />
              <NavLink to="/admin" label="Admin" role={role} allowed={["admin"]} />
            </nav>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {user ? (
              <>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                  <span style={{ color: "var(--gold)", textTransform: "capitalize" }}>{user.role}</span> · {user.name}
                </span>
                <button onClick={logout} style={{
                  padding: "5px 12px", borderRadius: 6, border: "1px solid var(--border)",
                  background: "transparent", color: "var(--muted)", fontSize: 12,
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.target.style.borderColor = "var(--red)"; e.target.style.color = "var(--red)"; }}
                onMouseLeave={e => { e.target.style.borderColor = "var(--border)"; e.target.style.color = "var(--muted)"; }}
                >Sign out</button>
              </>
            ) : (
              <Link to="/login" style={{
                padding: "5px 14px", borderRadius: 6, background: "var(--gold)",
                color: "#0f0e0e", fontSize: 12, fontWeight: 600,
              }}>Sign in</Link>
            )}
          </div>
        </header>

        <main style={{ flex: 1, padding: "32px 24px", maxWidth: 1100, margin: "0 auto", width: "100%" }}>
          {children}
        </main>
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<MenuPage />} />
          <Route path="/order" element={<OrderPage />} />
          <Route path="/kitchen" element={<KitchenDashboard />} />
          <Route path="/waiter" element={<WaiterDashboard />} />
          <Route path="/reservation" element={<ReservationPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  );
}
