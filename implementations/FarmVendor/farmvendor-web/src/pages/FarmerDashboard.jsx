import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

const API_BASE = "http://localhost:5136";

export default function Farmer_Dashboard() {
  const navigate = useNavigate();
  const displayName = localStorage.getItem("displayName") || "Farmer";

  const token = localStorage.getItem("token");

  const [stats, setStats] = useState({
    availableProducts: 0,
    expiringSoon: 0,
    upcomingRequests: 0,
  });

  const [stock, setStock] = useState([]);
  const [requests, setRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const authHeaders = useMemo(() => {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const getStatusBadge = (expiry) => {
    if (!expiry) return { text: "No Expiry", cls: "badge badge-gray" };

    const exp = new Date(expiry);
    const now = new Date();
    const diffDays = (exp - now) / (1000 * 60 * 60 * 24);

    if (diffDays <= 3) return { text: "Near Expiry", cls: "badge badge-orange" };
    return { text: "Fresh", cls: "badge badge-green" };
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const [statsRes, stockRes, reqRes] = await Promise.all([
          fetch(`${API_BASE}/api/farmer/dashboard/stats`, { headers: authHeaders }),
          fetch(`${API_BASE}/api/farmer/dashboard/stock`, { headers: authHeaders }),
          fetch(`${API_BASE}/api/farmer/dashboard/requests`, { headers: authHeaders }),
        ]);

        if (!statsRes.ok) throw new Error("Failed to load stats");
        if (!stockRes.ok) throw new Error("Failed to load stock");
        if (!reqRes.ok) throw new Error("Failed to load requests");

        const statsJson = await statsRes.json();
        const stockJson = await stockRes.json();
        const reqJson = await reqRes.json();

        setStats(statsJson);
        setStock(stockJson);
        setRequests(reqJson);
      } catch (e) {
        setError(e?.message || "Something went wrong loading dashboard");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, navigate, authHeaders]);

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
            <div className="sidebar-link active">Dashboard</div>
            <div className="sidebar-link">Products</div>
            <div className="sidebar-link">Requests</div>
            <div className="sidebar-link">Dispatch</div>
            <div className="sidebar-link" onClick={logout}>Logout</div>
          </nav>
        </aside>

        {/* Main */}
        <main className="main">
          <div className="main-inner">
            <div className="topbar">
              <div>
                <h1>Welcome, {displayName}</h1>
                <div className="sub">Overview of your stock and vendor requests</div>
              </div>
              <div className="topbar-right">
                <span className="pill">Role: Farmer</span>
                <button className="btn btn-secondary" onClick={logout}>
                  Logout
                </button>
              </div>
            </div>

            {error && <div className="auth-alert error">{error}</div>}
            {loading && <div className="auth-hint">Loading dashboard data...</div>}

            {/* Stats */}
            <section className="stats">
              <div className="stat-card">
                <div className="stat-top">
                  <div className="stat-title">Available Products</div>
                  <div className="stat-value">{stats.availableProducts}</div>
                </div>
                <div className="progress"><div style={{ width: "70%" }} /></div>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <div className="stat-title">Expiring Soon</div>
                  <div className="stat-value">{stats.expiringSoon}</div>
                </div>
                <div className="progress"><div style={{ width: "35%" }} /></div>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <div className="stat-title">Upcoming Requests</div>
                  <div className="stat-value">{stats.upcomingRequests}</div>
                </div>
                <div className="progress"><div style={{ width: "55%" }} /></div>
              </div>
            </section>

            {/* Sections */}
            <section className="grid-sections">
              {/* Current Stock */}
              <div className="card">
                <div className="card-header">
                  <h2>Current Stock</h2>
                  <button className="btn btn-secondary">View All</button>
                </div>

                <div className="card-body">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Expiry</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stock.length === 0 ? (
                        <tr><td colSpan="4">No inventory lots found.</td></tr>
                      ) : (
                        stock.map((row, idx) => {
                          const badge = getStatusBadge(row.expiry);
                          return (
                            <tr key={idx}>
                              <td>{row.product}</td>
                              <td>{row.qty} {row.unit}</td>
                              <td>{row.expiry ? new Date(row.expiry).toISOString().slice(0, 10) : "-"}</td>
                              <td><span className={badge.cls}>{badge.text}</span></td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Vendor Requests */}
              <div className="card">
                <div className="card-header">
                  <h2>Upcoming Vendor Requests</h2>
                  <button className="btn btn-secondary">View All</button>
                </div>

                <div className="card-body">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Needed By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.length === 0 ? (
                        <tr><td colSpan="3">No open demand requests found.</td></tr>
                      ) : (
                        requests.map((row, idx) => (
                          <tr key={idx}>
                            <td>{row.product}</td>
                            <td>{row.qty} {row.unit}</td>
                            <td>{new Date(row.neededBy).toISOString().slice(0, 10)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button className="btn btn-primary">Add Product Lot</button>
                    <button className="btn btn-secondary">Create Dispatch</button>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}
