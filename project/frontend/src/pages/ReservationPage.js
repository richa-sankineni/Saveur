import React, { useState, useEffect } from "react";
import api from "../api";
import { Card, PageHeader, Btn, StatusBadge, Input, Spinner, Empty, RequireAuth, toast, ToastContainer } from "../components";

export default function ReservationPage() {
  return (
    <RequireAuth roles={["customer", "waiter", "admin"]}>
      <ReservationInner />
    </RequireAuth>
  );
}

function ReservationInner() {
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ tableId: "", reservationTime: "", guestsCount: "" });
  const [user] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const fetchAll = () =>
    Promise.all([api.get("/reservations?limit=50"), api.get("/tables")])
      .then(([r, t]) => { setReservations(r.data.data || []); setTables(t.data.data || []); })
      .catch(() => toast.error("Failed to load data"));

  useEffect(() => { fetchAll().finally(() => setLoading(false)); }, []);

  const reserve = async () => {
    if (!form.tableId || !form.reservationTime || !form.guestsCount) {
      toast.error("Please fill in all fields"); return;
    }
    setSubmitting(true);
    try {
      await api.post("/reservations", {
        tableId: parseInt(form.tableId),
        reservationTime: new Date(form.reservationTime).toISOString(),
        guestsCount: parseInt(form.guestsCount),
      });
      toast.success("Reservation confirmed!");
      setForm({ tableId: "", reservationTime: "", guestsCount: "" });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Reservation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/reservations/${id}/status`, { status });
      toast.success(`Reservation ${status}`);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  const selectedTable = tables.find((t) => t.id === parseInt(form.tableId));

  if (loading) return <Spinner />;

  const upcoming = reservations.filter((r) => r.status !== "cancelled");
  const isStaff = ["admin", "waiter"].includes(user?.role);

  return (
    <>
      <ToastContainer />
      <PageHeader title="Reservations" subtitle={`${upcoming.length} upcoming reservations`} />

      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 24, alignItems: "start" }}>
     
        <div style={{ position: "sticky", top: 80 }}>
          <Card>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, marginBottom: 20, color: "var(--gold)" }}>Book a Table</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 6 }}>Select Table</label>
                <select value={form.tableId} onChange={set("tableId")} style={{
                  background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8,
                  padding: "9px 13px", color: "var(--text)", fontSize: 13, outline: "none", width: "100%",
                }}>
                  <option value="">— Choose table —</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      Table {t.tableNumber} — {t.capacity} seats ({t.status})
                    </option>
                  ))}
                </select>
              </div>

              {selectedTable && (
                <div style={{ padding: "10px 14px", background: "rgba(201,168,76,0.06)", borderRadius: 8, border: "1px solid rgba(201,168,76,0.2)", fontSize: 12 }}>
                  <div style={{ color: "var(--gold)", fontWeight: 600 }}>Table {selectedTable.tableNumber}</div>
                  <div style={{ color: "var(--muted)" }}>Capacity: {selectedTable.capacity} guests · Status: {selectedTable.status}</div>
                </div>
              )}

              <Input
                label="Date & Time"
                type="datetime-local"
                value={form.reservationTime}
                onChange={set("reservationTime")}
                min={new Date().toISOString().slice(0, 16)}
              />

              <Input
                label="Number of Guests"
                type="number"
                min="1"
                max={selectedTable?.capacity || 99}
                placeholder="e.g. 2"
                value={form.guestsCount}
                onChange={set("guestsCount")}
              />

              {form.guestsCount && selectedTable && parseInt(form.guestsCount) > selectedTable.capacity && (
                <div style={{ fontSize: 12, color: "var(--red)", padding: "8px 12px", background: "rgba(224,82,82,0.08)", borderRadius: 8 }}>
                  ⚠ Exceeds table capacity ({selectedTable.capacity} guests max)
                </div>
              )}

              <Btn onClick={reserve} disabled={submitting} size="lg" style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
                {submitting ? "Booking…" : "Confirm Reservation"}
              </Btn>
            </div>
          </Card>
        </div>

        
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {["All", "Pending", "Confirmed", "Cancelled"].map((s) => (
              <button key={s} style={{
                padding: "5px 12px", borderRadius: 99, border: "1px solid var(--border)", fontSize: 11,
                fontWeight: 600, cursor: "pointer", background: "transparent", color: "var(--muted)", fontFamily: "var(--font-body)",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.color = "var(--gold)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted)"; }}
              >{s}</button>
            ))}
          </div>

          {reservations.length === 0 ? <Empty icon="📅" message="No reservations yet" /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {reservations.map((r, i) => (
                <div key={r.id} className="fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                  <Card>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                          <span style={{ fontFamily: "var(--font-display)", fontSize: 16 }}>Table {r.tableNumber}</span>
                          <StatusBadge status={r.status} />
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text)", marginBottom: 2 }}>
                          👤 {r.customerName}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>
                          📅 {new Date(r.reservationTime).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                          👥 {r.guestsCount} guests
                        </div>
                      </div>
                      {isStaff && r.status === "pending" && (
                        <div style={{ display: "flex", gap: 8 }}>
                          <Btn size="sm" variant="success" onClick={() => updateStatus(r.id, "confirmed")}>✓ Confirm</Btn>
                          <Btn size="sm" variant="danger" onClick={() => updateStatus(r.id, "cancelled")}>✕ Cancel</Btn>
                        </div>
                      )}
                      {r.status === "pending" && !isStaff && (
                        <Btn size="sm" variant="danger" onClick={() => updateStatus(r.id, "cancelled")}>Cancel</Btn>
                      )}
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
