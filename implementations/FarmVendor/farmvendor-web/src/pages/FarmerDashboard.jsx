import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";
import FarmerSidebar from "../assets/components/FarmerSidebar";
import { getRecommendedVendors } from "../assets/forecastApi";

const API_BASE = import.meta.env.VITE_API_URL;

export default function FarmerDashboard() {
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
  const [recommendedVendors, setRecommendedVendors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [error, setError] = useState("");

  // Add Product Lot modal
  const [showAddLot, setShowAddLot] = useState(false);
  const [products, setProducts] = useState([]);
  const [lotForm, setLotForm] = useState({
    productId: "",
    quantityAvailable: "",
    unit: "",
    expiryDate: "",
  });
  const [savingLot, setSavingLot] = useState(false);

  // Create Dispatch modal
  const [showCreateDispatch, setShowCreateDispatch] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({
    demandRequestId: "",
    quantityDispatched: "",
    dispatchDate: "",
  });
  const [savingDispatch, setSavingDispatch] = useState(false);

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

  const loadProducts = async () => {
    const res = await fetch(`${API_BASE}/api/products/active`, { headers: authHeaders });
    const text = await res.text();
    if (!res.ok) throw new Error(text || "Failed to load products");
    setProducts(JSON.parse(text));
  };

  const loadDashboard = async () => {
    const [statsRes, stockRes, reqRes] = await Promise.all([
      fetch(`${API_BASE}/api/farmer/dashboard/stats`, { headers: authHeaders }),
      fetch(`${API_BASE}/api/farmer/dashboard/stock`, { headers: authHeaders }),
      fetch(`${API_BASE}/api/farmer/dashboard/requests`, { headers: authHeaders }),
    ]);

    const statsText = await statsRes.text();
    const stockText = await stockRes.text();
    const reqText = await reqRes.text();

    if (!statsRes.ok) throw new Error(statsText || "Failed to load stats");
    if (!stockRes.ok) throw new Error(stockText || "Failed to load stock");
    if (!reqRes.ok) throw new Error(reqText || "Failed to load requests");

    setStats(JSON.parse(statsText));
    setStock(JSON.parse(stockText));
    setRequests(JSON.parse(reqText));
  };

  const loadRecommendedVendors = async () => {
    setLoadingRecommendations(true);
    try {
      const data = await getRecommendedVendors(
        new Date().toISOString().slice(0, 10),
        token
      );
      setRecommendedVendors(data);
    } catch (e) {
      setError(e?.message || "Failed to load recommended vendors");
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // ---------- Add Lot ----------
  const openAddLot = async () => {
    setError("");
    setShowAddLot(true);

    if (products.length === 0) {
      try {
        await loadProducts();
      } catch (e) {
        setError(e?.message || "Failed to load products for lot form");
      }
    }
  };

  const submitLot = async (e) => {
    e.preventDefault();
    setError("");

    if (!lotForm.productId) return setError("Please select a product.");
    if (!lotForm.quantityAvailable || Number(lotForm.quantityAvailable) <= 0) {
      return setError("Quantity must be greater than 0.");
    }

    setSavingLot(true);
    try {
      const payload = {
        productId: Number(lotForm.productId),
        quantityAvailable: Number(lotForm.quantityAvailable),
        unit: lotForm.unit?.trim() ? lotForm.unit.trim() : null,
        expiryDate: lotForm.expiryDate
          ? new Date(lotForm.expiryDate).toISOString()
          : null,
      };

      const res = await fetch(`${API_BASE}/api/InventoryLots`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || "Failed to create inventory lot.");

      setShowAddLot(false);
      setLotForm({
        productId: "",
        quantityAvailable: "",
        unit: "",
        expiryDate: "",
      });

      await loadDashboard();
      await loadRecommendedVendors();
    } catch (err) {
      setError(err?.message || "Failed to save inventory lot");
    } finally {
      setSavingLot(false);
    }
  };

  // ---------- Create Dispatch ----------
  const openCreateDispatch = async () => {
    setError("");

    try {
      if (requests.length === 0) {
        await loadDashboard();
      }
    } catch (e) {
      setError(e?.message || "Failed to load requests");
    }

    setDispatchForm({
      demandRequestId: "",
      quantityDispatched: "",
      dispatchDate: "",
    });
    setShowCreateDispatch(true);
  };

  const submitDispatch = async (e) => {
    e.preventDefault();
    setError("");

    if (!dispatchForm.demandRequestId) return setError("Please select a request.");
    if (!dispatchForm.quantityDispatched || Number(dispatchForm.quantityDispatched) <= 0) {
      return setError("Dispatch quantity must be greater than 0.");
    }

    setSavingDispatch(true);
    try {
      const payload = {
        demandRequestId: Number(dispatchForm.demandRequestId),
        quantityDispatched: Number(dispatchForm.quantityDispatched),
        dispatchDate: dispatchForm.dispatchDate
          ? new Date(dispatchForm.dispatchDate).toISOString()
          : null,
      };

      const res = await fetch(`${API_BASE}/api/dispatches`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || "Failed to create dispatch.");

      setShowCreateDispatch(false);

      await loadDashboard();
      await loadRecommendedVendors();
    } catch (err) {
      setError(err?.message || "Failed to create dispatch.");
    } finally {
      setSavingDispatch(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const run = async () => {
      setLoading(true);
      setError("");
      try {
        await loadDashboard();
        await loadProducts();
        await loadRecommendedVendors();
      } catch (e) {
        setError(e?.message || "Something went wrong loading dashboard");
      } finally {
        setLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, navigate, authHeaders]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        <FarmerSidebar />

        <main className="main">
          <div className="main-inner">
            <div className="topbar">
              <div>
                <h1>Welcome, {displayName}</h1>
                <div className="sub">Overview of your stock, requests, and vendor recommendations</div>
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
                <div className="progress">
                  <div style={{ width: "70%" }} />
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <div className="stat-title">Expiring Soon</div>
                  <div className="stat-value">{stats.expiringSoon}</div>
                </div>
                <div className="progress">
                  <div style={{ width: "35%" }} />
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <div className="stat-title">Upcoming Requests</div>
                  <div className="stat-value">{stats.upcomingRequests}</div>
                </div>
                <div className="progress">
                  <div style={{ width: "55%" }} />
                </div>
              </div>
            </section>

            <section className="grid-sections">
              {/* Current Stock */}
              <div className="card">
                <div className="card-header">
                  <h2>Current Stock</h2>
                  <button className="btn btn-secondary" onClick={loadDashboard}>
                    Refresh
                  </button>
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
                        <tr>
                          <td colSpan="4">No inventory lots found.</td>
                        </tr>
                      ) : (
                        stock.map((row, idx) => {
                          const badge = getStatusBadge(row.expiry);
                          return (
                            <tr key={idx}>
                              <td>{row.product}</td>
                              <td>
                                {row.qty} {row.unit}
                              </td>
                              <td>
                                {row.expiry
                                  ? new Date(row.expiry).toISOString().slice(0, 10)
                                  : "-"}
                              </td>
                              <td>
                                <span className={badge.cls}>{badge.text}</span>
                              </td>
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
                  <button className="btn btn-secondary" onClick={loadDashboard}>
                    Refresh
                  </button>
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
                        <tr>
                          <td colSpan="3">No open demand requests found.</td>
                        </tr>
                      ) : (
                        requests.map((row, idx) => (
                          <tr key={row.demandRequestId ?? idx}>
                            <td>{row.product}</td>
                            <td>
                              {row.qty} {row.unit}
                            </td>
                            <td>{new Date(row.neededBy).toISOString().slice(0, 10)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button className="btn btn-primary" onClick={openAddLot}>
                      Add Product Lot
                    </button>
                    <button className="btn btn-secondary" onClick={openCreateDispatch}>
                      Create Dispatch
                    </button>
                  </div>

                  <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
                    Requests loaded: <b>{requests.length}</b>
                  </div>
                </div>
              </div>
            </section>

            {/* Top Vendors for Dispatching */}
            <section style={{ marginTop: 14 }}>
              <div className="card">
                <div className="card-header">
                  <h2>Top Vendors for Dispatching</h2>
                  <button
                    className="btn btn-secondary"
                    onClick={loadRecommendedVendors}
                    disabled={loadingRecommendations}
                  >
                    {loadingRecommendations ? "Loading..." : "Refresh"}
                  </button>
                </div>

                <div className="card-body">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Vendor</th>
                        <th>Products</th>
                        <th>Match Qty</th>
                        <th>Distance (km)</th>
                        <th>Relationship</th>
                        <th>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recommendedVendors.length === 0 ? (
                        <tr>
                          <td colSpan="6">No recommended vendors found.</td>
                        </tr>
                      ) : (
                        recommendedVendors.map((v) => (
                          <tr key={v.vendorId}>
                            <td>{v.vendorName}</td>
                            <td>{v.matchedProducts?.join(", ")}</td>
                            <td>{v.matchableQuantity}</td>
                            <td>{v.distanceKm}</td>
                            <td>{v.relationshipScore}</td>
                            <td>{v.finalScore}</td>
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

      {/* Add Product Lot Modal */}
      {showAddLot && (
        <div className="modal-backdrop" onClick={() => setShowAddLot(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Product Lot</h3>
              <button className="icon-btn" onClick={() => setShowAddLot(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={submitLot} className="modal-body">
              <label className="field">
                <span>Product</span>
                <select
                  value={lotForm.productId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const p = products.find((x) => String(x.productId) === String(id));
                    setLotForm((prev) => ({
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
                    value={lotForm.quantityAvailable}
                    onChange={(e) =>
                      setLotForm((prev) => ({ ...prev, quantityAvailable: e.target.value }))
                    }
                    placeholder="e.g., 50"
                  />
                </label>

                <label className="field">
                  <span>Unit</span>
                  <input
                    value={lotForm.unit}
                    onChange={(e) =>
                      setLotForm((prev) => ({ ...prev, unit: e.target.value }))
                    }
                    placeholder="kg / L / dozen"
                  />
                </label>
              </div>

              <label className="field">
                <span>Expiry Date (optional)</span>
                <input
                  type="date"
                  value={lotForm.expiryDate}
                  onChange={(e) =>
                    setLotForm((prev) => ({ ...prev, expiryDate: e.target.value }))
                  }
                />
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddLot(false)}
                >
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

      {/* Create Dispatch Modal */}
      {showCreateDispatch && (
        <div className="modal-backdrop" onClick={() => setShowCreateDispatch(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Dispatch</h3>
              <button className="icon-btn" onClick={() => setShowCreateDispatch(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={submitDispatch} className="modal-body">
              <label className="field">
                <span>Select Request</span>
                <select
                  value={dispatchForm.demandRequestId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const req = requests.find(
                      (x) => String(x.demandRequestId) === String(id)
                    );

                    setDispatchForm((prev) => ({
                      ...prev,
                      demandRequestId: id,
                      quantityDispatched: req ? String(req.qty) : prev.quantityDispatched,
                    }));
                  }}
                >
                  <option value="">-- Select --</option>
                  {requests.map((r) => (
                    <option key={r.demandRequestId} value={r.demandRequestId}>
                      #{r.demandRequestId} — {r.product} ({r.qty} {r.unit}) Needed:{" "}
                      {new Date(r.neededBy).toISOString().slice(0, 10)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Quantity to Dispatch</span>
                <input
                  type="number"
                  step="0.01"
                  value={dispatchForm.quantityDispatched}
                  onChange={(e) =>
                    setDispatchForm((prev) => ({
                      ...prev,
                      quantityDispatched: e.target.value,
                    }))
                  }
                />
              </label>

              <label className="field">
                <span>Dispatch Date (optional)</span>
                <input
                  type="date"
                  value={dispatchForm.dispatchDate}
                  onChange={(e) =>
                    setDispatchForm((prev) => ({
                      ...prev,
                      dispatchDate: e.target.value,
                    }))
                  }
                />
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateDispatch(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingDispatch}>
                  {savingDispatch ? "Creating..." : "Create Dispatch"}
                </button>
              </div>

              <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
                If options are missing, confirm your API returns <b>demandRequestId</b>.
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}