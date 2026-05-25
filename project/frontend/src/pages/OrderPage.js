import React, { useState, useEffect } from "react";
import api from "../api";
import { Card, PageHeader, Btn, StatusBadge, Input, Spinner, Empty, RequireAuth, toast, ToastContainer } from "../components";

const CATEGORY_ICONS = { Starter: "🥗", "Main Course": "🍛", Bread: "🫓", Drinks: "🥤", Dessert: "🍮" };

export default function OrderPage() {
  return (
    <RequireAuth roles={["customer", "waiter", "admin"]}>
      <OrderPageInner />
    </RequireAuth>
  );
}

function OrderPageInner() {
  const [menu, setMenu] = useState([]);
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [tableId, setTableId] = useState("");
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [tab, setTab] = useState("place"); // "place" | "orders"

  useEffect(() => {
    Promise.all([
      api.get("/menu?limit=100&available=true"),
      api.get("/tables"),
      api.get("/orders?limit=50"),
    ]).then(([m, t, o]) => {
      setMenu(m.data.data || []);
      setTables((t.data.data || []).filter(t => t.status === "available"));
      setOrders(o.data.data || []);
    }).catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false));
  }, []);

  const refreshOrders = () =>
    api.get("/orders?limit=50").then((r) => setOrders(r.data.data || []));

  const cartItem = (id) => selectedItems.find((i) => i.id === id);

  const toggleItem = (item) => {
    setSelectedItems((p) =>
      p.find((i) => i.id === item.id) ? p.filter((i) => i.id !== item.id) : [...p, { ...item, quantity: 1 }]
    );
  };

  const updateQty = (id, qty) => {
    if (qty < 1) { setSelectedItems((p) => p.filter((i) => i.id !== id)); return; }
    setSelectedItems((p) => p.map((i) => i.id === id ? { ...i, quantity: qty } : i));
  };

  const placeOrder = async () => {
    if (!tableId) { toast.error("Please select a table"); return; }
    if (selectedItems.length === 0) { toast.error("Please select at least one item"); return; }
    setPlacing(true);
    try {
      await api.post("/orders", {
        tableId: parseInt(tableId),
        items: selectedItems.map((i) => ({ menuItemId: i.id, quantity: i.quantity })),
      });
      toast.success("Order placed successfully!");
      setSelectedItems([]);
      setTableId("");
      setTab("orders");
      refreshOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  const payBill = async (orderId) => {
    try {
      await api.put(`/bills/${orderId}/pay`);
      toast.success("Bill paid successfully!");
      refreshOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to pay bill");
    }
  };

  const total = selectedItems.reduce((s, i) => s + i.price * i.quantity, 0);

  if (loading) return <Spinner />;

 
  const grouped = menu.reduce((acc, item) => {
    acc[item.category] = acc[item.category] || [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <>
      <ToastContainer />
      <PageHeader title="Orders" subtitle="Place a new order or track existing ones" />

   
      <div style={{ display: "flex", gap: 4, background: "var(--surface)", borderRadius: 10, padding: 4, width: "fit-content", marginBottom: 28, border: "1px solid var(--border)" }}>
        {[{ key: "place", label: "📝 New Order" }, { key: "orders", label: `📋 My Orders (${orders.length})` }].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: "7px 18px", borderRadius: 7, border: "none", fontSize: 13, fontWeight: 600,
            cursor: "pointer", transition: "all 0.2s", fontFamily: "var(--font-body)",
            background: tab === key ? "var(--gold)" : "transparent",
            color: tab === key ? "#0f0e0e" : "var(--muted)",
          }}>{label}</button>
        ))}
      </div>

      {tab === "place" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>
          
          <div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 6 }}>Select Table</label>
              <select value={tableId} onChange={(e) => setTableId(e.target.value)} style={{
                background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8,
                padding: "9px 13px", color: "var(--text)", fontSize: 13, outline: "none", width: 200,
              }}>
                <option value="">— Choose table —</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>Table {t.tableNumber} (seats {t.capacity})</option>
                ))}
              </select>
            </div>

            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat} style={{ marginBottom: 24 }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--muted)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>{CATEGORY_ICONS[cat] || "◎"}</span> {cat}
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                  {items.map((item) => {
                    const selected = !!cartItem(item.id);
                    return (
                      <div key={item.id} onClick={() => toggleItem(item)} style={{
                        background: selected ? "rgba(201,168,76,0.08)" : "var(--surface)",
                        border: `1px solid ${selected ? "var(--gold)" : "var(--border)"}`,
                        borderRadius: 10, padding: "12px 14px", cursor: "pointer", transition: "all 0.2s",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{item.name}</div>
                            {item.description && <div style={{ fontSize: 10, color: "var(--muted)", lineHeight: 1.4 }}>{item.description.slice(0, 40)}…</div>}
                          </div>
                          <span style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "var(--gold)", fontWeight: 700, marginLeft: 8, whiteSpace: "nowrap" }}>₹{item.price}</span>
                        </div>
                        {selected && (
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => updateQty(item.id, (cartItem(item.id)?.quantity || 1) - 1)} style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", cursor: "pointer" }}>−</button>
                            <span style={{ fontSize: 13, fontWeight: 700, minWidth: 20, textAlign: "center" }}>{cartItem(item.id)?.quantity}</span>
                            <button onClick={() => updateQty(item.id, (cartItem(item.id)?.quantity || 1) + 1)} style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid var(--gold)", background: "var(--gold)", color: "#0f0e0e", cursor: "pointer" }}>+</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          
          <div style={{ position: "sticky", top: 80 }}>
            <Card>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, marginBottom: 16, color: "var(--gold)" }}>Order Summary</h3>
              {selectedItems.length === 0 ? (
                <Empty icon="🛒" message="Tap items to add them" />
              ) : (
                <>
                  {selectedItems.map((item) => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>× {item.quantity}</div>
                      </div>
                      <span style={{ color: "var(--gold)", fontWeight: 600 }}>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0 0", fontFamily: "var(--font-display)", fontSize: 20 }}>
                    <span>Total</span>
                    <span style={{ color: "var(--gold)" }}>₹{total}</span>
                  </div>
                </>
              )}
              <Btn onClick={placeOrder} disabled={placing || selectedItems.length === 0 || !tableId} size="lg" style={{ width: "100%", justifyContent: "center", marginTop: 16 }}>
                {placing ? "Placing…" : "Place Order"}
              </Btn>
            </Card>
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div>
          {orders.length === 0 ? <Empty icon="📋" message="No orders yet" /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {orders.map((order, i) => (
                <div key={order.id} className="fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                  <Card style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <span style={{ fontFamily: "var(--font-display)", fontSize: 16 }}>Order #{order.id}</span>
                        <StatusBadge status={order.status} />
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        Table {order.tableNumber} · {order.items?.length || 0} items · {new Date(order.createdAt).toLocaleString()}
                      </div>
                      {order.waiterName && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Waiter: {order.waiterName}</div>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--gold)" }}>₹{order.totalAmount}</span>
                      {order.status === "completed" && (
                        <Btn size="sm" variant="success" onClick={() => payBill(order.id)}>Pay Bill</Btn>
                      )}
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
