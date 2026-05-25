import React, { useState, useEffect } from "react";
import api from "../api";
import { Card, PageHeader, Btn, StatusBadge, StatCard, Input, Select, Spinner, Empty, RequireAuth, toast, ToastContainer } from "../components";

export default function AdminDashboard() {
  return (
    <RequireAuth roles={["admin"]}>
      <AdminInner />
    </RequireAuth>
  );
}

function AdminInner() {
  const [tab, setTab] = useState("overview");
  const [summary, setSummary] = useState(null);
  const [menu, setMenu] = useState([]);
  const [tables, setTables] = useState([]);
  const [bills, setBills] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newItem, setNewItem] = useState({ name: "", category: "Starter", price: "", description: "", availability: true });
  const [editItem, setEditItem] = useState(null);
  const [newTable, setNewTable] = useState({ tableNumber: "", capacity: "" });

  const fetchAll = async () => {
    try {
      const [s, m, t, b, o] = await Promise.all([
        api.get("/dashboard/summary"),
        api.get("/menu?limit=100"),
        api.get("/tables?limit=50"),
        api.get("/bills?limit=50"),
        api.get("/orders?limit=50"),
      ]);
      setSummary(s.data.data);
      setMenu(m.data.data || []);
      setTables(t.data.data || []);
      setBills(b.data.data || []);
      setOrders(o.data.data || []);
    } catch { toast.error("Failed to load dashboard"); }
  };

  useEffect(() => { fetchAll().finally(() => setLoading(false)); }, []);


  const addMenuItem = async () => {
    if (!newItem.name || !newItem.price) { toast.error("Name and price required"); return; }
    try {
      await api.post("/menu", { ...newItem, price: parseFloat(newItem.price) });
      toast.success("Menu item added!");
      setNewItem({ name: "", category: "Starter", price: "", description: "", availability: true });
      api.get("/menu?limit=100").then((r) => setMenu(r.data.data || []));
    } catch (err) { toast.error(err.response?.data?.message || "Failed to add item"); }
  };

  const deleteMenuItem = async (id) => {
    if (!window.confirm("Delete this menu item?")) return;
    try {
      await api.delete(`/menu/${id}`);
      toast.success("Deleted");
      setMenu((p) => p.filter((i) => i.id !== id));
    } catch (err) { toast.error(err.response?.data?.message || "Failed to delete"); }
  };

  const toggleAvailability = async (item) => {
    try {
      await api.put(`/menu/${item.id}`, { availability: !item.availability });
      setMenu((p) => p.map((i) => i.id === item.id ? { ...i, availability: !i.availability } : i));
      toast.info(`${item.name} ${!item.availability ? "enabled" : "disabled"}`);
    } catch { toast.error("Failed to update"); }
  };


  const addTable = async () => {
    if (!newTable.tableNumber || !newTable.capacity) { toast.error("All fields required"); return; }
    try {
      await api.post("/tables", { tableNumber: parseInt(newTable.tableNumber), capacity: parseInt(newTable.capacity) });
      toast.success("Table added!");
      setNewTable({ tableNumber: "", capacity: "" });
      api.get("/tables?limit=50").then((r) => setTables(r.data.data || []));
    } catch (err) { toast.error(err.response?.data?.message || "Failed to add table"); }
  };

  const TABS = [
    { key: "overview", label: "📊 Overview" },
    { key: "menu", label: "🍛 Menu" },
    { key: "tables", label: "🪑 Tables" },
    { key: "orders", label: "📋 Orders" },
    { key: "bills", label: "💳 Bills" },
  ];

  if (loading) return <Spinner />;

  const CATEGORIES = ["Starter", "Main Course", "Bread", "Drinks", "Dessert"];

  return (
    <>
      <ToastContainer />
      <PageHeader title="Admin Dashboard" subtitle="Full system overview and management" />

      
      <div style={{ display: "flex", gap: 4, background: "var(--surface)", borderRadius: 10, padding: 4, marginBottom: 28, border: "1px solid var(--border)", width: "fit-content", flexWrap: "wrap" }}>
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: "7px 16px", borderRadius: 7, border: "none", fontSize: 12, fontWeight: 600,
            cursor: "pointer", transition: "all 0.2s", fontFamily: "var(--font-body)",
            background: tab === key ? "var(--gold)" : "transparent",
            color: tab === key ? "#0f0e0e" : "var(--muted)",
          }}>{label}</button>
        ))}
      </div>

      
      {tab === "overview" && summary && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
            <StatCard icon="🧾" label="Total Orders" value={summary.totalOrders} color="#5299e0" />
            <StatCard icon="💰" label="Revenue" value={`₹${summary.revenue?.toFixed(0)}`} color="var(--gold)" />
            <StatCard icon="🪑" label="Active Tables" value={`${summary.activeTables}/${summary.totalTables}`} color="#e0a852" />
            <StatCard icon="🔥" label="Kitchen Load" value={summary.kitchenLoad} color="#e05252" />
            <StatCard icon="👤" label="Customers" value={summary.totalCustomers} color="#52c97a" />
            <StatCard icon="📅" label="Pending Reservations" value={summary.pendingReservations} color="#9b52e0" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <Card>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, marginBottom: 14 }}>Orders by Status</h3>
              {summary.ordersByStatus?.map((s) => (
                <div key={s.status} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <StatusBadge status={s.status} />
                  <div style={{ flex: 1, height: 4, borderRadius: 2, background: "var(--border)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, (s.count / Math.max(summary.totalOrders, 1)) * 100)}%`, background: "var(--gold)", borderRadius: 2, transition: "width 0.8s ease" }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, minWidth: 24 }}>{s.count}</span>
                </div>
              ))}
            </Card>

            <Card>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, marginBottom: 14 }}>Top Selling Items</h3>
              {summary.topSellingItems?.length === 0 ? <Empty icon="📊" message="No data yet" /> :
                summary.topSellingItems?.map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                    <span style={{ color: i === 0 ? "var(--gold)" : "var(--text)" }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`} {item.name}
                    </span>
                    <span style={{ color: "var(--muted)" }}>{item.totalSold} sold</span>
                  </div>
                ))
              }
            </Card>
          </div>
        </>
      )}

      
      {tab === "menu" && (
        <>
          <Card style={{ marginBottom: 20 }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, marginBottom: 16 }}>Add Menu Item</h3>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
              <Input label="Item Name" placeholder="e.g. Paneer Tikka" value={newItem.name} onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))} />
              <Select label="Category" value={newItem.category} onChange={(e) => setNewItem((p) => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </Select>
              <Input label="Price (₹)" type="number" placeholder="199" value={newItem.price} onChange={(e) => setNewItem((p) => ({ ...p, price: e.target.value }))} />
              <Select label="Status" value={newItem.availability ? "1" : "0"} onChange={(e) => setNewItem((p) => ({ ...p, availability: e.target.value === "1" }))}>
                <option value="1">Available</option>
                <option value="0">Unavailable</option>
              </Select>
              <Btn onClick={addMenuItem} style={{ whiteSpace: "nowrap" }}>+ Add Item</Btn>
            </div>
            <Input label="Description (optional)" placeholder="Brief description of the dish" value={newItem.description} onChange={(e) => setNewItem((p) => ({ ...p, description: e.target.value }))} style={{ marginTop: 12 }} />
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {menu.map((item) => (
              <Card key={item.id} style={{ opacity: item.availability ? 1 : 0.6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{item.category}</div>
                  </div>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--gold)" }}>₹{item.price}</span>
                </div>
                {item.description && <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10, lineHeight: 1.4 }}>{item.description}</p>}
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn size="sm" variant={item.availability ? "secondary" : "success"} onClick={() => toggleAvailability(item)}>
                    {item.availability ? "Disable" : "Enable"}
                  </Btn>
                  <Btn size="sm" variant="danger" onClick={() => deleteMenuItem(item.id)}>Delete</Btn>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      
      {tab === "tables" && (
        <>
          <Card style={{ marginBottom: 20 }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, marginBottom: 16 }}>Add Table</h3>
            <div style={{ display: "flex", gap: 12, alignItems: "end" }}>
              <Input label="Table Number" type="number" placeholder="7" value={newTable.tableNumber} onChange={(e) => setNewTable((p) => ({ ...p, tableNumber: e.target.value }))} style={{ width: 140 }} />
              <Input label="Capacity (seats)" type="number" placeholder="4" value={newTable.capacity} onChange={(e) => setNewTable((p) => ({ ...p, capacity: e.target.value }))} style={{ width: 140 }} />
              <Btn onClick={addTable}>+ Add Table</Btn>
            </div>
          </Card>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
            {tables.map((t) => (
              <Card key={t.id} style={{ textAlign: "center", borderColor: t.status === "occupied" ? "var(--red)" : t.status === "reserved" ? "#e0a852" : "var(--green)" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--gold)", marginBottom: 4 }}>T{t.tableNumber}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>Seats {t.capacity}</div>
                <StatusBadge status={t.status} />
              </Card>
            ))}
          </div>
        </>
      )}

      
      {tab === "orders" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {orders.length === 0 ? <Empty icon="📋" message="No orders yet" /> : orders.map((order, i) => (
            <div key={order.id} className="fade-up" style={{ animationDelay: `${i * 0.03}s` }}>
              <Card style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 15 }}>#{order.id}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    Table {order.tableNumber} · {order.customerName} · {new Date(order.createdAt).toLocaleString()}
                  </div>
                  {order.waiterName && <div style={{ fontSize: 11, color: "var(--muted)" }}>Waiter: {order.waiterName}</div>}
                </div>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--gold)" }}>₹{order.totalAmount}</span>
              </Card>
            </div>
          ))}
        </div>
      )}

      
      {tab === "bills" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {bills.length === 0 ? <Empty icon="💳" message="No bills generated yet" /> : bills.map((bill, i) => (
            <div key={bill.id} className="fade-up" style={{ animationDelay: `${i * 0.03}s` }}>
              <Card style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, borderColor: bill.paymentStatus === "paid" ? "var(--green)" : "var(--border)" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 15 }}>Order #{bill.orderId}</span>
                    <StatusBadge status={bill.paymentStatus} />
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    Table {bill.tableNumber} · {bill.customerName} · {new Date(bill.generatedAt).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--gold)" }}>₹{bill.amount}</span>
                  {bill.paymentStatus === "pending" && (
                    <Btn size="sm" variant="success" onClick={async () => {
                      try {
                        await api.put(`/bills/${bill.orderId}/pay`);
                        toast.success("Bill marked paid");
                        api.get("/bills?limit=50").then((r) => setBills(r.data.data || []));
                      } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
                    }}>Mark Paid</Btn>
                  )}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
