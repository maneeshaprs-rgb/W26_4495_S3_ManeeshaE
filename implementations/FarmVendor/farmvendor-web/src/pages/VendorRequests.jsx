import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

const API_BASE = import.meta.env.VITE_API_URL;

export default function VendorRequests() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const displayName = localStorage.getItem("displayName") || "Vendor";

  const [error, setError] = useState("");
  const [myRequests, setMyRequests] = useState([]);
  const [status, setStatus] = useState("Open");

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

  const loadMyRequests = async (s = status) => {
    const res = await fetch(`${API_BASE}/api/vendor/demandrequests?status=${encodeURIComponent(s)}`, {
      headers: authHeaders,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(text || "Failed to load vendor requests");
    setMyRequests(JSON.parse(text));
  };

  useEffect(() => {
    if (!token) return navigate("/login");
    (async () => {
      try {
        setError("");
        await loadMyRequests("Open");
      } catch (e) {
        setError(e?.message || "Failed to load requests");
      }
    })();
  }, [token, navigate]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="sidebar-logo">FV</div>
            <div>
              <div className="sidebar-title">FarmVendor</div>
              <div className="sidebar-subtitle">Vendor Panel</div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="sidebar-link" onClick={() => navigate("/vendor")}>Dashboard</div>
            <div className="sidebar-link" onClick={() => navigate("/vendor/stock")}>Stock</div>
            <div className="sidebar-link active">Requests</div>
            <div className="sidebar-link" onClick={() => navigate("/vendor/incoming")}>Incoming</div>
            <div className="sidebar-link" onClick={logout}>Logout</div>
          </nav>
        </aside>

        <main className="main">
          <div className="main-inner">
            <div className="topbar">
              <div>
                <h1>{displayName} — Demand Requests</h1>
                <div className="sub">Track your created demand requests</div>
              </div>
              <div className="topbar-right">
                <span className="pill">Role: Vendor</span>
                <button className="btn btn-secondary" onClick={logout}>Logout</button>
              </div>
            </div>

            {error && <div className="auth-alert error">{error}</div>}

            <div className="card">
              <div className="card-header">
                <h2>My Requests</h2>

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <select
                    value={status}
                    onChange={async (e) => {
                      const s = e.target.value;
                      setStatus(s);
                      try {
                        setError("");
                        await loadMyRequests(s);
                      } catch (err) {
                        setError(err?.message || "Failed to filter");
                      }
                    }}
                  >
                    <option value="Open">Open</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Fulfilled">Fulfilled</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>

                  <button className="btn btn-secondary" onClick={() => loadMyRequests(status)}>
                    Refresh
                  </button>
                </div>
              </div>

              <div className="card-body">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Needed By</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myRequests.length === 0 ? (
                      <tr><td colSpan="5">No requests found.</td></tr>
                    ) : (
                      myRequests.map((r) => (
                        <tr key={r.demandRequestId}>
                          <td>#{r.demandRequestId}</td>
                          <td>{r.product}</td>
                          <td>{r.qty} {r.unit}</td>
                          <td>{new Date(r.neededBy).toISOString().slice(0, 10)}</td>
                          <td>{r.status}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}>
                  Requests loaded: <b>{myRequests.length}</b>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}