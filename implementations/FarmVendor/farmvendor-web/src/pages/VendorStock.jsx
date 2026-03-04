import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

const API_BASE = import.meta.env.VITE_API_URL;

export default function VendorStock() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const displayName = localStorage.getItem("displayName") || "Vendor";

  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);

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

  const loadProducts = async () => {
    const res = await fetch(`${API_BASE}/api/products/active`, { headers: authHeaders });
    const text = await res.text();
    if (!res.ok) throw new Error(text || "Failed to load products");
    setProducts(JSON.parse(text));
  };

  useEffect(() => {
    if (!token) return navigate("/login");
    (async () => {
      try {
        setError("");
        await loadProducts();
      } catch (e) {
        setError(e?.message || "Failed to load vendor stock");
      }
    })();
  }, [token, navigate]); // this keep simple deps

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
            <div className="sidebar-link active">Stock</div>
            <div className="sidebar-link" onClick={() => navigate("/vendor/requests")}>Requests</div>
            <div className="sidebar-link" onClick={() => navigate("/vendor/incoming")}>Incoming</div>
            <div className="sidebar-link" onClick={logout}>Logout</div>
          </nav>
        </aside>

        <main className="main">
          <div className="main-inner">
            <div className="topbar">
              <div>
                <h1>{displayName} — Stock</h1>
                <div className="sub">View the product catalog (used for demand requests)</div>
              </div>
              <div className="topbar-right">
                <span className="pill">Role: Vendor</span>
                <button className="btn btn-secondary" onClick={logout}>Logout</button>
              </div>
            </div>

            {error && <div className="auth-alert error">{error}</div>}

            <div className="card">
              <div className="card-header">
                <h2>Active Products</h2>
                <button className="btn btn-secondary" onClick={loadProducts}>Refresh</button>
              </div>

              <div className="card-body">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Default Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr><td colSpan="3">No products found.</td></tr>
                    ) : (
                      products.map((p) => (
                        <tr key={p.productId}>
                          <td>{p.productId}</td>
                          <td>{p.name}</td>
                          <td>{p.defaultUnit}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}>
                  Products loaded: <b>{products.length}</b>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}