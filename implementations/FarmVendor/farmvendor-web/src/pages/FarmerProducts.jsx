import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

const API_BASE = import.meta.env.VITE_API_URL; // e.g., http://localhost:5136

export default function FarmerProducts() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const displayName = localStorage.getItem("displayName") || "Farmer";

  const authHeaders = useMemo(() => {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Catalog
  const [products, setProducts] = useState([]);

  // My lots
  const [lots, setLots] = useState([]);

  // Add Lot modal
  const [showAddLot, setShowAddLot] = useState(false);
  const [lotForm, setLotForm] = useState({
    productId: "",
    quantityAvailable: "",
    unit: "",
    expiryDate: "",
  });
  const [savingLot, setSavingLot] = useState(false);

  // Edit Lot modal
  const [showEditLot, setShowEditLot] = useState(false);
  const [editLot, setEditLot] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const loadCatalog = async () => {
    const res = await fetch(`${API_BASE}/api/products/active`, { headers: authHeaders });
    const text = await res.text();
    if (!res.ok) throw new Error(text || "Failed to load products");
    setProducts(JSON.parse(text));
  };

  const loadMyLots = async () => {
    const res = await fetch(`${API_BASE}/api/farmer/inventorylots`, { headers: authHeaders });
    const text = await res.text();
    if (!res.ok) throw new Error(text || "Failed to load inventory lots");
    setLots(JSON.parse(text));
  };

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      await Promise.all([loadCatalog(), loadMyLots()]);
    } catch (e) {
      setError(e?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Add Lot ----------
  const openAddLot = () => {
    setError("");
    setLotForm({ productId: "", quantityAvailable: "", unit: "", expiryDate: "" });
    setShowAddLot(true);
  };

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

      const res = await fetch(`${API_BASE}/api/InventoryLots`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || "Failed to create inventory lot.");

      setShowAddLot(false);
      await loadMyLots();
    } catch (err) {
      setError(err?.message || "Failed to save inventory lot");
    } finally {
      setSavingLot(false);
    }
  };

  // ---------- Edit Lot ----------
  const openEdit = (lot) => {
    setError("");
    setEditLot({
      inventoryLotId: lot.inventoryLotId,
      productName: lot.productName,
      quantityAvailable: String(lot.quantityAvailable ?? ""),
      unit: lot.unit ?? "",
      expiryDate: lot.expiryDate ? new Date(lot.expiryDate).toISOString().slice(0, 10) : "",
    });
    setShowEditLot(true);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    setError("");

    if (!editLot) return;

    const qty = Number(editLot.quantityAvailable);
    if (Number.isNaN(qty) || qty < 0) return setError("Quantity must be 0 or greater.");

    setSavingEdit(true);
    try {
      const payload = {
        quantityAvailable: qty,
        unit: editLot.unit?.trim() ? editLot.unit.trim() : null,
        expiryDate: editLot.expiryDate ? new Date(editLot.expiryDate).toISOString() : null,
      };

      const res = await fetch(`${API_BASE}/api/farmer/inventorylots/${editLot.inventoryLotId}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || "Failed to update lot.");

      setShowEditLot(false);
      await loadMyLots();
    } catch (err) {
      setError(err?.message || "Failed to update lot");
    } finally {
      setSavingEdit(false);
    }
  };

  // ---------- Delete Lot ----------
  const deleteLot = async (id) => {
    if (!window.confirm("Delete this inventory lot?")) return;

    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/farmer/inventorylots/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || "Failed to delete lot.");

      await loadMyLots();
    } catch (e) {
      setError(e?.message || "Failed to delete lot");
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
            <div className="sidebar-link" onClick={() => navigate("/farmer")}>
              Dashboard
            </div>
            <div className="sidebar-link active" onClick={() => navigate("/farmer/products")}>
              Products
            </div>
            <div className="sidebar-link" onClick={() => navigate("/farmer/requests")}>
              Requests
            </div>
            <div className="sidebar-link" onClick={() => navigate("/farmer/dispatch")}>
              Dispatch
            </div>
            <div className="sidebar-link" onClick={logout}>
              Logout
            </div>
          </nav>
        </aside>

        {/* Main */}
        <main className="main">
          <div className="main-inner">
            <div className="topbar">
              <div>
                <h1>Products</h1>
                <div className="sub">Manage your inventory lots and view product catalog</div>
              </div>
              <div className="topbar-right">
                <span className="pill">Welcome, {displayName}</span>
                <button className="btn btn-secondary" onClick={logout}>
                  Logout
                </button>
              </div>
            </div>

            {error && <div className="auth-alert error">{error}</div>}
            {loading && <div className="auth-hint">Loading...</div>}

            <section className="grid-sections">
              {/* Catalog */}
              <div className="card">
                <div className="card-header">
                  <h2>Active Product Catalog</h2>
                  <button className="btn btn-secondary" onClick={loadCatalog}>
                    Refresh
                  </button>
                </div>
                <div className="card-body">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Default Unit</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.length === 0 ? (
                        <tr>
                          <td colSpan="3">No products found.</td>
                        </tr>
                      ) : (
                        products.map((p) => (
                          <tr key={p.productId}>
                            <td>{p.name}</td>
                            <td>{p.defaultUnit}</td>
                            <td>
                              <span className="badge badge-green">Active</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* My Lots */}
              <div className="card">
                <div className="card-header">
                  <h2>My Inventory Lots</h2>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button className="btn btn-secondary" onClick={loadMyLots}>
                      Refresh
                    </button>
                    <button className="btn btn-primary" onClick={openAddLot}>
                      Add Lot
                    </button>
                  </div>
                </div>

                <div className="card-body">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Expiry</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lots.length === 0 ? (
                        <tr>
                          <td colSpan="4">No lots yet. Click “Add Lot”.</td>
                        </tr>
                      ) : (
                        lots.map((l) => (
                          <tr key={l.inventoryLotId}>
                            <td>{l.productName}</td>
                            <td>
                              {l.quantityAvailable} {l.unit}
                            </td>
                            <td>{l.expiryDate ? new Date(l.expiryDate).toISOString().slice(0, 10) : "-"}</td>
                            <td style={{ display: "flex", gap: 8 }}>
                              <button className="btn btn-secondary" onClick={() => openEdit(l)}>
                                Edit
                              </button>
                              <button className="btn btn-secondary" onClick={() => deleteLot(l.inventoryLotId)}>
                                Delete
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
          </div>
        </main>
      </div>

      {/* Add Lot Modal */}
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
                    onChange={(e) => setLotForm((prev) => ({ ...prev, quantityAvailable: e.target.value }))}
                  />
                </label>

                <label className="field">
                  <span>Unit</span>
                  <input value={lotForm.unit} onChange={(e) => setLotForm((prev) => ({ ...prev, unit: e.target.value }))} />
                </label>
              </div>

              <label className="field">
                <span>Expiry Date (optional)</span>
                <input
                  type="date"
                  value={lotForm.expiryDate}
                  onChange={(e) => setLotForm((prev) => ({ ...prev, expiryDate: e.target.value }))}
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

      {/* Edit Lot Modal */}
      {showEditLot && editLot && (
        <div className="modal-backdrop" onClick={() => setShowEditLot(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Lot — {editLot.productName}</h3>
              <button className="icon-btn" onClick={() => setShowEditLot(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={submitEdit} className="modal-body">
              <label className="field">
                <span>Quantity</span>
                <input
                  type="number"
                  step="0.01"
                  value={editLot.quantityAvailable}
                  onChange={(e) => setEditLot((prev) => ({ ...prev, quantityAvailable: e.target.value }))}
                />
              </label>

              <label className="field">
                <span>Unit</span>
                <input value={editLot.unit} onChange={(e) => setEditLot((prev) => ({ ...prev, unit: e.target.value }))} />
              </label>

              <label className="field">
                <span>Expiry Date (optional)</span>
                <input
                  type="date"
                  value={editLot.expiryDate}
                  onChange={(e) => setEditLot((prev) => ({ ...prev, expiryDate: e.target.value }))}
                />
              </label>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditLot(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingEdit}>
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}