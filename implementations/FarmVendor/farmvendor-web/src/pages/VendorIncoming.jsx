import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";
import VendorSidebar from "../assets/components/VendorSidebar";

const API_BASE = import.meta.env.VITE_API_URL;

export default function VendorIncoming() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const displayName = localStorage.getItem("displayName") || "Vendor";

  const [error, setError] = useState("");
  const [incoming, setIncoming] = useState([]);
  const [confirmingId, setConfirmingId] = useState(null);

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

  const loadIncoming = async () => {
    const res = await fetch(`${API_BASE}/api/vendor/dispatches/incoming`, { headers: authHeaders });
    const text = await res.text();
    if (!res.ok) throw new Error(text || "Failed to load incoming dispatches");
    setIncoming(JSON.parse(text));
  };

  const confirmDelivery = async (dispatchId) => {
    setError("");
    setConfirmingId(dispatchId);
    try {
      const res = await fetch(`${API_BASE}/api/vendor/dispatches/confirm`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ dispatchId }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || "Failed to confirm delivery");
      await loadIncoming();
    } catch (e) {
      setError(e?.message || "Confirm delivery failed");
    } finally {
      setConfirmingId(null);
    }
  };

  useEffect(() => {
    if (!token) return navigate("/login");
    (async () => {
      try {
        setError("");
        await loadIncoming();
      } catch (e) {
        setError(e?.message || "Failed to load incoming");
      }
    })();
  }, [token, navigate]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        <VendorSidebar />

        <main className="main">
          <div className="main-inner">
            <div className="topbar">
              <div>
                <h1>{displayName} — Incoming Dispatches</h1>
                <div className="sub">Confirm deliveries and track incoming items</div>
              </div>
              <div className="topbar-right">
                <span className="pill">Role: Vendor</span>
                <button className="btn btn-secondary" onClick={logout}>Logout</button>
              </div>
            </div>

            {error && <div className="auth-alert error">{error}</div>}

            <div className="card">
              <div className="card-header">
                <h2>Incoming</h2>
                <button className="btn btn-secondary" onClick={loadIncoming}>Refresh</button>
              </div>

              <div className="card-body">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Dispatch</th>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Status</th>
                      <th>Dispatch Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incoming.length === 0 ? (
                      <tr><td colSpan="6">No incoming dispatches.</td></tr>
                    ) : (
                      incoming.map((d) => (
                        <tr key={d.dispatchId}>
                          <td>#{d.dispatchId}</td>
                          <td>{d.product}</td>
                          <td>{d.quantityDispatched} {d.unit}</td>
                          <td>{d.deliveryStatus}</td>
                          <td>{new Date(d.dispatchDate).toISOString().slice(0, 10)}</td>
                          <td>
                            <button
                              className="btn btn-primary"
                              onClick={() => confirmDelivery(d.dispatchId)}
                              disabled={confirmingId === d.dispatchId || d.deliveryStatus === "Delivered"}
                            >
                              {confirmingId === d.dispatchId ? "Confirming..." : "Confirm Delivery"}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}>
                  Incoming loaded: <b>{incoming.length}</b>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}