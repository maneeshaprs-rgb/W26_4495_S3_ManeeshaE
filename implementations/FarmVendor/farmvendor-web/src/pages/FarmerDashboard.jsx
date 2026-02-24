import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

const API_BASE = import.meta.env.VITE_API_URL;//"http://localhost:5136";

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

  //added for product lot entering by farmer
  const [showAddLot, setShowAddLot] = useState(false);
  const [products, setProducts] = useState([]);
  const [lotForm, setLotForm] = useState({
    productId: "",
    quantityAvailable: "",
    unit: "",
    expiryDate: "",
  });
const [savingLot, setSavingLot] = useState(false);

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
        await loadProducts();

        setStats(statsJson);
        setStock(stockJson);
        setRequests(reqJson);
      } catch (e) {
        setError(e?.message || "Something went wrong loading dashboard");
      } finally {
        setLoading(false);
      }
    };

    //Load products once
    const loadProducts = async () => {
      const res = await fetch(`${API_BASE}/api/products/active`, { headers: authHeaders });
      if (!res.ok) throw new Error("Failed to load products");
      const data = await res.json();
      setProducts(data);
    };

    //submit function
    const submitLot = async (e) => {
      e.preventDefault();
      setError("");

      if (!lotForm.productId) return setError("Please select a product.");
      if (!lotForm.quantityAvailable || Number(lotForm.quantityAvailable) <= 0)
        return setError("Quantity must be greater than 0.");

      setSavingLot(true);
      try {
        const payload = {
          productId: Number(lotForm.productId),
          quantityAvailable: Number(lotForm.quantityAvailable),
          unit: lotForm.unit?.trim() ? lotForm.unit.trim() : null,
          expiryDate: lotForm.expiryDate ? new Date(lotForm.expiryDate).toISOString() : null,
        };

        const res = await fetch(`${API_BASE}/api/inventorylots`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify(payload),
        });

        const text = await res.text();
        if (!res.ok) throw new Error(text || "Failed to create inventory lot.");

        // refresh dashboard lists
        setShowAddLot(false);
        setLotForm({ productId: "", quantityAvailable: "", unit: "", expiryDate: "" });

        // reload dashboard data (call your existing load again)
        // simplest: call the same endpoints again:
        const [statsRes, stockRes, reqRes] = await Promise.all([
          fetch(`${API_BASE}/api/farmer/dashboard/stats`, { headers: authHeaders }),
          fetch(`${API_BASE}/api/farmer/dashboard/stock`, { headers: authHeaders }),
          fetch(`${API_BASE}/api/farmer/dashboard/requests`, { headers: authHeaders }),
        ]);

        setStats(await statsRes.json());
        setStock(await stockRes.json());
        setRequests(await reqRes.json());
      } catch (err) {
        setError(err?.message || "Failed to save inventory lot");
      } finally {
        setSavingLot(false);
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
                    <button className="btn btn-primary" onClick={() => setShowAddLot(true)}>
                      Add Product Lot
                    </button>
                    <button className="btn btn-secondary">Create Dispatch</button>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </main>
      </div>


      {showAddLot && (
      <div className="modal-backdrop" onClick={() => setShowAddLot(false)}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Add Product Lot</h3>
            <button className="icon-btn" onClick={() => setShowAddLot(false)}>✕</button>
          </div>

          <form onSubmit={submitLot} className="modal-body">
            <label className="field">
              <span>Product</span>
              <select
                value={lotForm.productId}
                onChange={(e) => {
                  const id = e.target.value;
                  const p = products.find(x => String(x.productId) === String(id));
                  setLotForm(prev => ({
                    ...prev,
                    productId: id,
                    unit: prev.unit || (p?.defaultUnit ?? ""),
                  }));
                }}
              >
                <option value="">-- Select --</option>
                {products.map(p => (
                  <option key={p.productId} value={p.productId}>
                    {p.name} ({p.defaultUnit})
                  </option>
                ))}
              </select>
            </label>

            <div className="row">
              <label className="field">
                <span>Quantity</span>
                <input
                  type="number"
                  step="0.01"
                  value={lotForm.quantityAvailable}
                  onChange={(e) => setLotForm(prev => ({ ...prev, quantityAvailable: e.target.value }))}
                  placeholder="e.g., 50"
                />
              </label>

              <label className="field">
                <span>Unit</span>
                <input
                  value={lotForm.unit}
                  onChange={(e) => setLotForm(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="kg / L / dozen"
                />
              </label>
            </div>

            <label className="field">
              <span>Expiry Date (optional)</span>
              <input
                type="date"
                value={lotForm.expiryDate}
                onChange={(e) => setLotForm(prev => ({ ...prev, expiryDate: e.target.value }))}
              />
            </label>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddLot(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={savingLot}>
                {savingLot ? "Saving..." : "Save Lot"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    </div>
  );
}
