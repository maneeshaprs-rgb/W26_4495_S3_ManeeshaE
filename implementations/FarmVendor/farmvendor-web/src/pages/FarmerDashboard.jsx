import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

export default function Farmer_Dashboard() {
  const navigate = useNavigate();
  const displayName = localStorage.getItem("displayName") || "Farmer";

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("displayName");
    navigate("/login");
  };

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

            {/* Stats */}
            <section className="stats">
              <div className="stat-card">
                <div className="stat-top">
                  <div className="stat-title">Available Products</div>
                  <div className="stat-value">12</div>
                </div>
                <div className="progress"><div style={{ width: "70%" }} /></div>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <div className="stat-title">Expiring Soon</div>
                  <div className="stat-value">3</div>
                </div>
                <div className="progress"><div style={{ width: "35%" }} /></div>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <div className="stat-title">Upcoming Requests</div>
                  <div className="stat-value">5</div>
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
                      <tr>
                        <td>Strawberries</td>
                        <td>30 kg</td>
                        <td>2026-02-10</td>
                        <td><span className="badge badge-green">Fresh</span></td>
                      </tr>
                      <tr>
                        <td>Milk</td>
                        <td>12 L</td>
                        <td>2026-02-06</td>
                        <td><span className="badge badge-orange">Near Expiry</span></td>
                      </tr>
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
                      <tr>
                        <td>Onions</td>
                        <td>50 kg</td>
                        <td>2026-02-12</td>
                      </tr>
                      <tr>
                        <td>Tomatoes</td>
                        <td>30 kg</td>
                        <td>2026-02-09</td>
                      </tr>
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
