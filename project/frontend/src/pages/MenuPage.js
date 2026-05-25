import React, { useState, useEffect } from "react";
import api from "../api";
import { Card, PageHeader, Btn, StatusBadge, Spinner, Empty, toast, ToastContainer } from "../components";

const CATEGORY_ICONS = { Starter: "🥗", "Main Course": "🍛", Bread: "🫓", Drinks: "🥤", Dessert: "🍮" };

export default function MenuPage() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState([]);

  const categories = ["All", "Starter", "Main Course", "Bread", "Drinks", "Dessert"];

  useEffect(() => {
    api.get("/menu?limit=100")
      .then((r) => setMenu(r.data.data || []))
      .catch(() => toast.error("Failed to load menu"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = category === "All" ? menu : menu.filter((i) => i.category === category);
  const available = filtered.filter((i) => i.availability);

  const cartItem = (id) => cart.find((c) => c.id === id);

  const addToCart = (item) => {
    setCart((p) => p.find((c) => c.id === item.id) ? p : [...p, { ...item, quantity: 1 }]);
    toast.success(`${item.name} added to cart`);
  };

  const updateQty = (id, qty) => {
    if (qty < 1) { setCart((p) => p.filter((c) => c.id !== id)); return; }
    setCart((p) => p.map((c) => c.id === id ? { ...c, quantity: qty } : c));
  };

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <>
      <ToastContainer />
      <PageHeader title="Our Menu" subtitle={`${menu.filter(m => m.availability).length} items available today`} />

      
      <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
        {categories.map((c) => (
          <button key={c} onClick={() => setCategory(c)} style={{
            padding: "7px 16px", borderRadius: 99, border: "1px solid",
            fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
            borderColor: category === c ? "var(--gold)" : "var(--border)",
            background: category === c ? "var(--gold)" : "transparent",
            color: category === c ? "#0f0e0e" : "var(--muted)",
          }}>
            {CATEGORY_ICONS[c] || "◎"} {c}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, alignItems: "start" }}>
      
        <div>
          {loading ? <Spinner /> : available.length === 0 ? (
            <Empty icon="🍽️" message="No items in this category" />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {available.map((item, i) => (
                <div key={item.id} className="fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                  <Card style={{ padding: 0, overflow: "hidden", transition: "border-color 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "var(--gold)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
                  >
                    {/* Colour swatch header */}
                    <div style={{ height: 6, background: `hsl(${item.id * 47 % 360}, 50%, 45%)` }} />
                    <div style={{ padding: "16px 18px" }}>
                      <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
                        {CATEGORY_ICONS[item.category]} {item.category}
                      </div>
                      <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, marginBottom: 4, color: "var(--text)" }}>{item.name}</h3>
                      {item.description && <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 12, lineHeight: 1.5 }}>{item.description}</p>}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                        <span style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--gold)", fontWeight: 700 }}>₹{item.price}</span>
                        {cartItem(item.id) ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <button onClick={() => updateQty(item.id, (cartItem(item.id)?.quantity || 1) - 1)} style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", cursor: "pointer", fontSize: 14 }}>−</button>
                            <span style={{ fontSize: 13, fontWeight: 600, minWidth: 20, textAlign: "center" }}>{cartItem(item.id)?.quantity}</span>
                            <button onClick={() => updateQty(item.id, (cartItem(item.id)?.quantity || 1) + 1)} style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid var(--gold)", background: "var(--gold)", color: "#0f0e0e", cursor: "pointer", fontSize: 14 }}>+</button>
                          </div>
                        ) : (
                          <Btn size="sm" onClick={() => addToCart(item)}>+ Add</Btn>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>

      
        <div style={{ position: "sticky", top: 80 }}>
          <Card>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, marginBottom: 16, color: "var(--gold)" }}>🛒 Cart</h3>
            {cart.length === 0 ? (
              <Empty icon="🛒" message="Add items from the menu" />
            ) : (
              <>
                {cart.map((item) => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>₹{item.price} × {item.quantity}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--gold)" }}>₹{item.price * item.quantity}</span>
                      <button onClick={() => setCart(p => p.filter(c => c.id !== item.id))} style={{ border: "none", background: "none", color: "var(--red)", cursor: "pointer", fontSize: 14 }}>✕</button>
                    </div>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0 0", fontFamily: "var(--font-display)", fontSize: 18 }}>
                  <span>Total</span>
                  <span style={{ color: "var(--gold)" }}>₹{total}</span>
                </div>
                <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>Go to Order page to place this order.</p>
              </>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
