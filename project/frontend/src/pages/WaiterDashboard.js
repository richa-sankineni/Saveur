import React, { useState, useEffect, useRef } from "react";
import api from "../api";
import { Card, PageHeader, Btn, StatusBadge, StatCard, Spinner, Empty, RequireAuth, toast, ToastContainer } from "../components";

export default function WaiterDashboard() {
  return (
    <RequireAuth roles={["waiter", "admin"]}>
      <WaiterInner />
    </RequireAuth>
  );
}

function WaiterInner() {
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const intervalRef = useRef();

  const fetchAll = () =>
    Promise.all([api.get("/orders?limit=100"), api.get("/tables")])
      .then(([o, t]) => { setOrders(o.data.data || []); setTables(t.data.data || []); })
      .catch(() => {});

  useEffect(() => {
    fetchAll().finally(() => setLoading(false));
    intervalRef.current = setInterval(fetchAll, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      toast.success(`Order #${orderId} → ${status}`);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const payBill = async (orderId) => {
    try {
      await api.put(`/bills/${orderId}/pay`);
      toast.success("Bill marked as paid!");
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to pay bill");
    }
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const counts = {
    received: orders.filter((o) => o.status === "received").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    ready: orders.filter((o) => o.status === "ready").length,
    completed: orders.filter((o) => o.status === "completed").length,
  };

  const activeTables = tables.filter((t) => t.status === "occupied").length;

  if (loading) return <Spinner />;

  return (
    <>
      <ToastContainer />
      <PageHeader
        title="Waiter Dashboard"
        subtitle={`Live · ${orders.filter(o => ["received","preparing","ready"].includes(o.status)).length} active orders`}
        action={<span style={{ fontSize: 11, color: "var(--muted)", padding: "6px 12px", border: "1px solid var(--border)", borderRadius: 6 }}>🔄 Auto-refresh 5s</span>}
      />

      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatCard icon="🪑" label="Occupied Tables" value={activeTables} color="#5299e0" />
        <StatCard icon="📥" label="New Orders" value={counts.received} color="#e05252" />
        <StatCard icon="✅" label="Ready to Serve" value={counts.ready} color="#52c97a" />
        <StatCard icon="🏁" label="Completed" value={counts.completed} color="var(--muted)" />
      </div>

   
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, marginBottom: 14 }}>Table Status</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {tables.map((t) => (
            <div key={t.id} style={{
              padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: "1px solid",
              borderColor: t.status === "occupied" ? "var(--red)" : t.status === "reserved" ? "#e0a852" : "var(--green)",
              color: t.status === "occupied" ? "var(--red)" : t.status === "reserved" ? "#e0a852" : "var(--green)",
              background: t.status === "occupied" ? "rgba(224,82,82,0.08)" : t.status === "reserved" ? "rgba(224,168,82,0.08)" : "rgba(82,201,122,0.08)",
            }}>
              T{t.tableNumber} {t.status === "occupied" ? "🔴" : t.status === "reserved" ? "🟡" : "🟢"}
            </div>
          ))}
        </div>
      </Card>

     
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { key: "all", label: "All Orders" },
          { key: "received", label: `New (${counts.received})` },
          { key: "preparing", label: `Cooking (${counts.preparing})` },
          { key: "ready", label: `Ready (${counts.ready})` },
          { key: "completed", label: `Done (${counts.completed})` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)} style={{
            padding: "6px 14px", borderRadius: 99, border: "1px solid", fontSize: 12, fontWeight: 600, cursor: "pointer",
            fontFamily: "var(--font-body)", transition: "all 0.2s",
            borderColor: filter === key ? "var(--gold)" : "var(--border)",
            background: filter === key ? "var(--gold)" : "transparent",
            color: filter === key ? "#0f0e0e" : "var(--muted)",
          }}>{label}</button>
        ))}
      </div>

      
      {filtered.length === 0 ? <Empty icon="🍽️" message="No orders in this category" /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((order, i) => (
            <div key={order.id} className="fade-up" style={{ animationDelay: `${i * 0.03}s` }}>
              <Card style={{ borderColor: order.status === "ready" ? "var(--green)" : "var(--border)", transition: "border-color 0.3s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700 }}>Order #{order.id}</span>
                      <StatusBadge status={order.status} />
                      {order.status === "ready" && <span style={{ fontSize: 10, color: "var(--green)", fontWeight: 700 }}>🔔 Serve now!</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>
                      Table {order.tableNumber} · {order.customerName} · ₹{order.totalAmount}
                    </div>
                    {order.items && (
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                        {order.items.map((i) => `${i.menuItemName} ×${i.quantity}`).join(", ")}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {order.status === "received" && (
                      <Btn size="sm" variant="secondary" onClick={() => updateStatus(order.id, "preparing")}>→ Kitchen</Btn>
                    )}
                    {order.status === "ready" && (
                      <Btn size="sm" onClick={() => updateStatus(order.id, "completed")}>Served ✓</Btn>
                    )}
                    {order.status === "completed" && (
                      <Btn size="sm" variant="success" onClick={() => payBill(order.id)}>💳 Pay Bill</Btn>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
