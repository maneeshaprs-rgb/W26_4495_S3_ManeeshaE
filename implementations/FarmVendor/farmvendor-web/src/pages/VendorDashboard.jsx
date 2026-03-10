// src/pages/VendorDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

const API_BASE = import.meta.env.VITE_API_URL; // http://localhost:5136

export default function Vendor_Dashboard() {
  const navigate = useNavigate();
  const displayName = localStorage.getItem("displayName") || "Vendor";
  const token = localStorage.getItem("token");

  const [error, setError] = useState("");

  // Products for dropdown
  const [products, setProducts] = useState([]);

  // (Optional) If you later want to show vendor requests list
  const [myRequests, setMyRequests] = useState([]);

  // Create Demand Request modal state
  const [showCreateDemand, setShowCreateDemand] = useState(false);
  const [demandForm, setDemandForm] = useState({
    productId: "",
    quantityRequested: "",
    unit: "",
    neededBy: "",
  });
  const [savingDemand, setSavingDemand] = useState(false);

  const authHeaders = useMemo(() => {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("displayName");
    navigate("/login");
  };

  //state for incoming dispatch
  const [incomingDispatches, setIncomingDispatches] = useState([]);
  const [confirmingId, setConfirmingId] = useState(null);

  // ---------------- API LOADERS ----------------
  const loadProducts = async () => {
    const res = await fetch(`${API_BASE}/api/products/active`, {
      headers: authHeaders,
    });

    const text = await res.text();
    if (!res.ok) throw new Error(text || "Failed to load products");
    setProducts(JSON.parse(text));
  };

  
  const loadMyRequests = async () => {
    const res = await fetch(`${API_BASE}/api/vendor/demandrequests?status=Open`, {
      headers: authHeaders,
    });

    const text = await res.text();
    if (!res.ok) throw new Error(text || "Failed to load vendor requests");
    setMyRequests(JSON.parse(text));
  };

  //get incoming dispatches
  const loadIncomingDispatches = async () => {
    const res = await fetch(`${API_BASE}/api/vendor/dispatches/incoming`, {
      headers: authHeaders,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(text || "Failed to load incoming dispatches");
    setIncomingDispatches(JSON.parse(text));
  };

  const loadDashboard = async () => {
    // For now, only need products + myRequests.
    // Later add vendor stats endpoints and fetch them here.
    await Promise.all([loadProducts(), loadMyRequests(),loadIncomingDispatches()]);
  };

  // ---------------- MODAL OPEN create demand ----------------
  const openCreateDemand = async () => {
    setError("");
    try {
      if (products.length === 0) await loadProducts();
    } catch (e) {
      setError(e?.message || "Failed to load products");
      return;
    }

    setDemandForm({ productId: "", quantityRequested: "", unit: "", neededBy: "" });
    setShowCreateDemand(true);
  };
  // ---------------- MODALSUBMIT DEMAND REQUEST----------------
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

      setShowCreateDemand(false);

      // refresh (loads new request list, etc.)
      await loadMyRequests();
    } catch (err) {
      setError(err?.message || "Failed to create demand request.");
    } finally {
      setSavingDemand(false);
    }
  };

  //----------------mODAL CONFIRM DELIVERY----------------------
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

      // refresh incoming list (and any stats if you have)
      await loadIncomingDispatches();
      await loadMyRequests();
    } catch (e) {
      setError(e?.message || "Confirm delivery failed");
    } finally {
      setConfirmingId(null);
    }
  };

  // ---------------- INITIAL LOAD ----------------
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const run = async () => {
      setError("");
      try {
        await loadDashboard();
      } catch (e) {
        setError(e?.message || "Failed to load vendor dashboard");
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, navigate]);

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
            <div className="sidebar-link" onClick={() => navigate("/vendor/stock")}>Stock</div>
            <div className="sidebar-link" onClick={() => navigate("/vendor/requests")}>Requests</div>
            <div className="sidebar-link" onClick={() => navigate("/vendor/incoming")}>Incoming</div>
            <div className="sidebar-link" onClick={() => navigate("/vendor/analytics")}>
              Analytics
            </div>
            <div className="sidebar-link" onClick={logout}>Logout</div>
          </nav>
        </aside>

        {/* Main */}
        <main className="main">
          <div className="main-inner">
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

            {error && <div className="auth-alert error">{error}</div>}

            {/* Stats (static for now) */}
            <section className="stats">
              <div className="stat-card">
                <div className="stat-top">
                  <div className="stat-title">Incoming Deliveries</div>
                  <div className="stat-value">{incomingDispatches.length}</div>
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
                    {/* IMPORTANT: wire button */}
                    <button className="btn btn-primary" onClick={openCreateDemand}>
                      Create Demand Request
                    </button>
                  </div>

                  <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}>
                    Products loaded: <b>{products.length}</b>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h2>Incoming Dispatches</h2>
                  <button className="btn btn-secondary" onClick={loadIncomingDispatches}>Refresh</button>
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
                      {incomingDispatches.length === 0 ? (
                        <tr>
                          <td colSpan="6">No incoming dispatches.</td>
                        </tr>
                      ) : (
                        incomingDispatches.map((d) => (
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
                </div>
              </div>
            </section>

            {/* Optional: show created requests list (quick sanity) */}
            <section style={{ marginTop: 14 }}>
              <div className="card">
                <div className="card-header">
                  <h2>My Open Demand Requests</h2>
                  <button className="btn btn-secondary" onClick={loadMyRequests}>Refresh</button>
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
                        <tr><td colSpan="5">No open requests.</td></tr>
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
                </div>
              </div>
            </section>

          </div>
        </main>
      </div>

      {/* Create Demand Request Modal */}
      {showCreateDemand && (
        <div className="modal-backdrop" onClick={() => setShowCreateDemand(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Demand Request</h3>
              <button className="icon-btn" onClick={() => setShowCreateDemand(false)}>✕</button>
            </div>

            <form onSubmit={submitDemandRequest} className="modal-body">
              <label className="field">
                <span>Product</span>
                <select
                  value={demandForm.productId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const p = products.find((x) => String(x.productId) === String(id));
                    setDemandForm((prev) => ({
                      ...prev,
                      productId: id,
                      unit: prev.unit || (p?.defaultUnit ?? ""),
                    }));
                  }}
                >
                  <option value="">-- Select --</option>
                  {products.map((p) => (
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
                    value={demandForm.quantityRequested}
                    onChange={(e) =>
                      setDemandForm((prev) => ({ ...prev, quantityRequested: e.target.value }))
                    }
                    placeholder="e.g., 25"
                  />
                </label>

                <label className="field">
                  <span>Unit</span>
                  <input
                    value={demandForm.unit}
                    onChange={(e) =>
                      setDemandForm((prev) => ({ ...prev, unit: e.target.value }))
                    }
                    placeholder="kg / L / dozen"
                  />
                </label>
              </div>

              <label className="field">
                <span>Needed By</span>
                <input
                  type="date"
                  value={demandForm.neededBy}
                  onChange={(e) =>
                    setDemandForm((prev) => ({ ...prev, neededBy: e.target.value }))
                  }
                />
              </label>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateDemand(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingDemand}>
                  {savingDemand ? "Creating..." : "Create Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}