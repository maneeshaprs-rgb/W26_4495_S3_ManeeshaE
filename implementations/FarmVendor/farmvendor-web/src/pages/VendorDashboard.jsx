import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

export default function Vendor_Dashboard() {
  const navigate = useNavigate();
  const displayName = localStorage.getItem("displayName") || "Vendor";

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("displayName");
    navigate("/login");
  };

  //sates for add
  const [showCreateDemand, setShowCreateDemand] = useState(false);
  const [demandForm, setDemandForm] = useState({
    productId: "",
    quantityRequested: "",
    unit: "",
    neededBy: "",
  });
  const [savingDemand, setSavingDemand] = useState(false);

  //Add open + submit
  const openCreateDemand = async () => {
    setError("");
    // load products for dropdown (if not loaded yet)
    try {
      if (products.length === 0) await loadProducts();
    } catch (e) {
      setError(e?.message || "Failed to load products");
      return;
    }

    setDemandForm({ productId: "", quantityRequested: "", unit: "", neededBy: "" });
    setShowCreateDemand(true);
  };

  const submitDemandRequest = async (e) => {
    e.preventDefault();
    setError("");

    if (!demandForm.productId) return setError("Please select a product.");
    if (!demandForm.quantityRequested || Number(demandForm.quantityRequested) <= 0)
      return setError("Quantity must be greater than 0.");
    if (!demandForm.neededBy) return setError("Please select Needed By date.");

    setSavingDemand(true);
    try {
      const payload = {
        productId: Number(demandForm.productId),
        quantityRequested: Number(demandForm.quantityRequested),
        unit: demandForm.unit?.trim() ? demandForm.unit.trim() : null,
        neededBy: new Date(demandForm.neededBy).toISOString(),
      };

      const res = await fetch(`${API_BASE}/api/vendor/demandrequests`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || "Failed to create demand request.");

      // Refresh dashboard lists (or push returned item into requests state)
      setShowCreateDemand(false);
      await loadDashboard(); // your vendor dashboard loader
    } catch (err) {
      setError(err?.message || "Failed to create demand request.");
    } finally {
      setSavingDemand(false);
    }
  };
  
  //end of Add open + submit
  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="sidebar-logo">FV</div>
            <div>
              <div className="sidebar-title">FarmVendor</div>
              <div className="sidebar-subtitle">Vendor Panel</div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="sidebar-link active">Dashboard</div>
            <div className="sidebar-link">Stock</div>
            <div className="sidebar-link">Requests</div>
            <div className="sidebar-link">Incoming</div>
            <div className="sidebar-link" onClick={logout}>Logout</div>
          </nav>
        </aside>

        {/* Main */}
        <main className="main">
          <div className="topbar">
            <div>
              <h1>Welcome, {displayName}</h1>
              <div className="sub">Inventory and incoming dispatch overview</div>
            </div>
            <div className="topbar-right">
              <span className="pill">Role: Vendor</span>
              <button className="btn btn-secondary" onClick={logout}>
                Logout
              </button>
            </div>
          </div>

          {/* Stats */}
          <section className="stats">
            <div className="stat-card">
              <div className="stat-top">
                <div className="stat-title">Incoming Deliveries</div>
                <div className="stat-value">4</div>
              </div>
              <div className="progress"><div style={{ width: "50%" }} /></div>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <div className="stat-title">Low Stock Alerts</div>
                <div className="stat-value">2</div>
              </div>
              <div className="progress"><div style={{ width: "30%" }} /></div>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <div className="stat-title">Expiring Items</div>
                <div className="stat-value">1</div>
              </div>
              <div className="progress"><div style={{ width: "20%" }} /></div>
            </div>
          </section>

          {/* Sections */}
          <section className="grid-sections">
            <div className="card">
              <div className="card-header">
                <h2>Low Stock</h2>
                <button className="btn btn-secondary">View All</button>
              </div>
              <div className="card-body">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Level</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Eggs</td>
                      <td>12 Dozens</td>
                      <td><span className="badge badge-orange">Low</span></td>
                    </tr>
                    <tr>
                      <td>Tomatoes</td>
                      <td>8 kg</td>
                      <td><span className="badge badge-red">Critical</span></td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ marginTop: 12 }}>
                  <button className="btn btn-primary">Create Demand Request</button>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2>Incoming Dispatches</h2>
                <button className="btn btn-secondary">View All</button>
              </div>
              <div className="card-body">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Farmer</th>
                      <th>Product</th>
                      <th>ETA</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Maple Farm</td>
                      <td>Leaf Lettuce</td>
                      <td>2026-02-08</td>
                    </tr>
                    <tr>
                      <td>Green Field</td>
                      <td>Milk</td>
                      <td>2026-02-07</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                  <button className="btn btn-primary">Confirm Delivery</button>
                  <button className="btn btn-secondary">Report Issue</button>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
