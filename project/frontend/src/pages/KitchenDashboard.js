import React, { useState, useEffect, useRef } from "react";
import api from "../api";
import { Card, PageHeader, Btn, StatusBadge, StatCard, Spinner, Empty, RequireAuth, toast, ToastContainer } from "../components";

export default function KitchenDashboard() {
  return (
    <RequireAuth roles={["chef", "admin"]}>
      <KitchenInner />
    </RequireAuth>
  );
}

function KitchenInner() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active"); // "active" | "all"
  const intervalRef = useRef();

  const fetchOrders = () =>
    api.get("/orders?limit=50")
      .then((r) => setOrders(r.data.data || []))
      .catch(() => {});

  useEffect(() => {
    fetchOrders().finally(() => setLoading(false));
    intervalRef.current = setInterval(fetchOrders, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      toast.success(`Order #${orderId} → ${status}`);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Status update failed");
    }
  };

  const activeOrders = orders.filter((o) => ["received", "preparing"].includes(o.status));
  const displayed = filter === "active" ? activeOrders : orders;

  const statuses = {
    received: orders.filter((o) => o.status === "received").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    ready: orders.filter((o) => o.status === "ready").length,
    completed: orders.filter((o) => o.status === "completed").length,
  };

  const ORDER_ACTIONS = {
    received: { next: "preparing", label: "Start Cooking", icon: "🔥" },
    preparing: { next: "ready", label: "Mark Ready", icon: "✅" },
  };

  if (loading) return <Spinner />;

  return (
    <>
      <ToastContainer />
      <PageHeader
        title="Kitchen Dashboard"
        subtitle={`Auto-refreshes every 5s · ${activeOrders.length} active orders`}
        action={<div style={{ display: "flex", gap: 6 }}>
          {[{ key: "active", label: "Active" }, { key: "all", label: "All" }].map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)} style={{
              padding: "6px 14px", borderRadius: 7, border: "1px solid var(--border)", fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.2s",
              background: filter === key ? "var(--gold)" : "var(--surface)", color: filter === key ? "#0f0e0e" : "var(--muted)",
            }}>{label}</button>
          ))}
        </div>}
      />

      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <StatCard icon="📥" label="Received" value={statuses.received} color="#5299e0" />
        <StatCard icon="🔥" label="Preparing" value={statuses.preparing} color="#e0a852" />
        <StatCard icon="✅" label="Ready" value={statuses.ready} color="#52c97a" />
        <StatCard icon="🏁" label="Completed" value={statuses.completed} color="var(--muted)" />
      </div>

    
      {filter === "active" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
          {["received", "preparing"].map((colStatus) => (
            <div key={colStatus}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <StatusBadge status={colStatus} />
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{statuses[colStatus]} orders</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {orders.filter((o) => o.status === colStatus).length === 0 ? (
                  <Card style={{ textAlign: "center", padding: 24 }}>
                    <p style={{ color: "var(--muted)", fontSize: 12 }}>No orders here</p>
                  </Card>
                ) : orders.filter((o) => o.status === colStatus).map((order, i) => (
                  <OrderCard key={order.id} order={order} action={ORDER_ACTIONS[colStatus]} onAction={updateStatus} i={i} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      
      {filter === "all" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {displayed.length === 0 ? <Empty icon="🍳" message="No orders yet" /> : displayed.map((order, i) => (
            <OrderCard key={order.id} order={order} action={ORDER_ACTIONS[order.status]} onAction={updateStatus} i={i} />
          ))}
        </div>
      )}
    </>
  );
}

function OrderCard({ order, action, onAction, i }) {
  const [expanded, setExpanded] = useState(false);
  const timeSince = (dt) => {
    const mins = Math.floor((Date.now() - new Date(dt)) / 60000);
    return mins < 1 ? "just now" : `${mins}m ago`;
  };
  const isUrgent = order.status === "received" && (Date.now() - new Date(order.createdAt)) > 5 * 60000;

  return (
    <div className="fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
      <Card style={{
        borderColor: isUrgent ? "var(--red)" : "var(--border)",
        transition: "border-color 0.3s",
        position: "relative",
        overflow: "hidden",
      }}>
        {isUrgent && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "var(--red)", animation: "pulse 1.5s infinite" }} />}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700 }}>Order #{order.id}</span>
              <StatusBadge status={order.status} />
              {isUrgent && <span style={{ fontSize: 10, color: "var(--red)", fontWeight: 700, textTransform: "uppercase" }}>⚠ Urgent</span>}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              Table {order.tableNumber} · {order.customerName} · {timeSince(order.createdAt)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => setExpanded(p => !p)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "var(--muted)", cursor: "pointer" }}>
              {expanded ? "▲ Hide" : "▼ Items"}
            </button>
            {action && (
              <Btn size="sm" onClick={() => onAction(order.id, action.next)}>
                {action.icon} {action.label}
              </Btn>
            )}
          </div>
        </div>

        {expanded && order.items && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
            {order.items.map((item) => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}>
                <span>{item.menuItemName}</span>
                <span style={{ color: "var(--muted)" }}>× {item.quantity}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
