import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

const API_BASE = import.meta.env.VITE_API_URL;

const STATUS_OPTIONS = ["All", "Planned", "InTransit", "Delivered", "Cancelled"];

export default function FarmerDispatch() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const displayName = localStorage.getItem("displayName") || "Farmer";

  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const [statusFilter, setStatusFilter] = useState("All");
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Status modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedDispatch, setSelectedDispatch] = useState(null);
  const [newStatus, setNewStatus] = useState("Planned");
  const [saving, setSaving] = useState(false);

  const loadDispatches = async () => {
    setLoading(true);
    setError("");
    try {
      const qs = statusFilter === "All" ? "" : `?status=${encodeURIComponent(statusFilter)}`;
      const res = await fetch(`${API_BASE}/api/farmer/dispatches${qs}`, { headers: authHeaders });
      const text = await res.text();
      if (!res.ok) throw new Error(text || "Failed to load dispatches");
      setDispatches(JSON.parse(text));
    } catch (e) {
      setError(e?.message || "Failed to load dispatches");
    } finally {
      setLoading(false);
    }
  };

  const openStatusModal = (d) => {
    setError("");
    setSelectedDispatch(d);
    setNewStatus(d.deliveryStatus || "Planned");
    setShowStatusModal(true);
  };

  const saveStatus = async (e) => {
    e.preventDefault();
    if (!selectedDispatch) return;

    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        `${API_BASE}/api/farmer/dispatches/${selectedDispatch.dispatchId}/status`,
        {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({ deliveryStatus: newStatus }),
        }
      );

      const text = await res.text();
      if (!res.ok) throw new Error(text || "Failed to update status");

      setShowStatusModal(false);
      await loadDispatches();
    } catch (e2) {
      setError(e2?.message || "Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    loadDispatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, statusFilter]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="sidebar-logo">FV</div>
            <div>
              <div className="sidebar-title">FarmVendor</div>
              <div className="sidebar-subtitle">Farmer Panel</div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="sidebar-link" onClick={() => navigate("/farmer")}>Dashboard</div>
            <div className="sidebar-link" onClick={() => navigate("/farmer/products")}>Products</div>
            <div className="sidebar-link" onClick={() => navigate("/farmer/requests")}>Requests</div>
            <div className="sidebar-link active" onClick={() => navigate("/farmer/dispatch")}>Dispatch</div>
            <div className="sidebar-link" onClick={logout}>Logout</div>
          </nav>
        </aside>

        {/* Main */}
        <main className="main">
          <div className="main-inner">
            <div className="topbar">
              <div>
                <h1>Dispatch</h1>
                <div className="sub">Track and update delivery status</div>
              </div>
              <div className="topbar-right">
                <span className="pill">Welcome, {displayName}</span>
                <button className="btn btn-secondary" onClick={logout}>Logout</button>
              </div>
            </div>

            {error && <div className="auth-alert error">{error}</div>}
            {loading && <div className="auth-hint">Loading dispatches...</div>}

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>Filter:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: "10px", borderRadius: 10, border: "1px solid #e5e7eb" }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <button className="btn btn-secondary" onClick={loadDispatches}>Refresh</button>
            </div>

            <div className="card" style={{ marginTop: 14 }}>
              <div className="card-header">
                <h2>My Dispatches ({dispatches.length})</h2>
              </div>

              <div className="card-body">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Vendor</th>
                      <th>Dispatch Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {dispatches.length === 0 ? (
                      <tr>
                        <td colSpan="7">No dispatches found.</td>
                      </tr>
                    ) : (
                      dispatches.map((d) => (
                        <tr key={d.dispatchId}>
                          <td>#{d.dispatchId}</td>
                          <td>{d.product}</td>
                          <td>{d.quantityDispatched} {d.unit}</td>
                          <td>{d.vendorName || d.vendorEmail || d.vendorId || "-"}</td>
                          <td>{d.dispatchDate ? new Date(d.dispatchDate).toISOString().slice(0, 10) : "-"}</td>
                          <td>{d.deliveryStatus}</td>
                          <td>
                            <button className="btn btn-primary" onClick={() => openStatusModal(d)}>
                              Update Status
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}>
                  Status flow: Planned → InTransit → Delivered (or Cancelled)
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Update Status Modal */}
      {showStatusModal && selectedDispatch && (
        <div className="modal-backdrop" onClick={() => setShowStatusModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Dispatch Status</h3>
              <button className="icon-btn" onClick={() => setShowStatusModal(false)}>✕</button>
            </div>

            <form onSubmit={saveStatus} className="modal-body">
              <div style={{ fontSize: 13 }}>
                <b>Dispatch:</b> #{selectedDispatch.dispatchId} — {selectedDispatch.product} ({selectedDispatch.quantityDispatched} {selectedDispatch.unit})
              </div>

              <label className="field">
                <span>New Status</span>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                  <option value="Planned">Planned</option>
                  <option value="InTransit">InTransit</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </label>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowStatusModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>

              <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
                Note: Delivered/Cancelled cannot be changed back (by backend rule).
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}