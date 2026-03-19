import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";
import FarmerSidebar from "../assets/components/FarmerSidebar";

const API_BASE = import.meta.env.VITE_API_URL;

export default function FarmerRequests() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const displayName = localStorage.getItem("displayName") || "Farmer";

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

  const [tab, setTab] = useState("open"); // open | history
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [openRequests, setOpenRequests] = useState([]);
  const [history, setHistory] = useState([]);

  // Create Dispatch modal
  const [showCreateDispatch, setShowCreateDispatch] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({
    demandRequestId: "",
    quantityDispatched: "",
    dispatchDate: "",
  });
  const [savingDispatch, setSavingDispatch] = useState(false);

  const loadOpen = async () => {
    const res = await fetch(`${API_BASE}/api/farmer/requests/open`, { headers: authHeaders });
    const text = await res.text();
    if (!res.ok) throw new Error(text || "Failed to load open requests");
    setOpenRequests(JSON.parse(text));
  };

  const loadHistory = async () => {
    const res = await fetch(`${API_BASE}/api/farmer/requests/history`, { headers: authHeaders });
    const text = await res.text();
    if (!res.ok) throw new Error(text || "Failed to load request history");
    setHistory(JSON.parse(text));
  };

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      await Promise.all([loadOpen(), loadHistory()]);
    } catch (e) {
      setError(e?.message || "Failed loading requests");
    } finally {
      setLoading(false);
    }
  };

  // Open dispatch modal for a selected request
  const openDispatchFor = (r) => {
    setError("");
    setDispatchForm({
      demandRequestId: String(r.demandRequestId),
      quantityDispatched: String(r.qty),
      dispatchDate: r.neededBy ? new Date(r.neededBy).toISOString().slice(0, 10) : "",
    });
    setShowCreateDispatch(true);
  };

  const submitDispatch = async (e) => {
    e.preventDefault();
    setError("");

    if (!dispatchForm.demandRequestId) return setError("Please select a request.");
    if (!dispatchForm.quantityDispatched || Number(dispatchForm.quantityDispatched) <= 0)
      return setError("Dispatch quantity must be greater than 0.");

    setSavingDispatch(true);
    try {
      const payload = {
        demandRequestId: Number(dispatchForm.demandRequestId),
        quantityDispatched: Number(dispatchForm.quantityDispatched),
        dispatchDate: dispatchForm.dispatchDate ? new Date(dispatchForm.dispatchDate).toISOString() : null,
      };

      const res = await fetch(`${API_BASE}/api/dispatches`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || "Failed to create dispatch.");

      setShowCreateDispatch(false);

      // refresh lists (request likely becomes Accepted)
      await loadAll();
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
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const data = tab === "open" ? openRequests : history;

  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        {/* Sidebar */}
        <FarmerSidebar />

        {/* Main */}
        <main className="main">
          <div className="main-inner">
            <div className="topbar">
              <div>
                <h1>Farmer Requests</h1>
                <div className="sub">View open vendor requests and create dispatches</div>
              </div>
              <div className="topbar-right">
                <span className="pill">Welcome, {displayName}</span>
                <button className="btn btn-secondary" onClick={logout}>Logout</button>
              </div>
            </div>

            {error && <div className="auth-alert error">{error}</div>}
            {loading && <div className="auth-hint">Loading...</div>}

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                className={tab === "open" ? "btn btn-primary" : "btn btn-secondary"}
                onClick={() => setTab("open")}
              >
                Open Requests ({openRequests.length})
              </button>
              <button
                className={tab === "history" ? "btn btn-primary" : "btn btn-secondary"}
                onClick={() => setTab("history")}
              >
                History ({history.length})
              </button>
              <button className="btn btn-secondary" onClick={loadAll}>Refresh</button>
            </div>

            <div className="card" style={{ marginTop: 14 }}>
              <div className="card-header">
                <h2>{tab === "open" ? "Open Vendor Requests" : "Request History"}</h2>
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
                      <th>Vendor</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.length === 0 ? (
                      <tr>
                        <td colSpan="7">
                          {tab === "open" ? "No open requests right now." : "No history yet."}
                        </td>
                      </tr>
                    ) : (
                      data.map((r, idx) => (
                        <tr key={r.demandRequestId ?? idx}>
                          <td>#{r.demandRequestId}</td>
                          <td>{r.product}</td>
                          <td>{r.qty} {r.unit}</td>
                          <td>{r.neededBy ? new Date(r.neededBy).toISOString().slice(0, 10) : "-"}</td>
                          <td>{r.status}</td>
                          <td>{r.vendorName || r.vendorEmail || r.vendorId || "-"}</td>
                          <td>
                            {tab === "open" ? (
                              <button className="btn btn-primary" onClick={() => openDispatchFor(r)}>
                                Create Dispatch
                              </button>
                            ) : (
                              <span style={{ color: "#6b7280" }}>—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* Create Dispatch Modal */}
      {showCreateDispatch && (
        <div className="modal-backdrop" onClick={() => setShowCreateDispatch(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Dispatch</h3>
              <button className="icon-btn" onClick={() => setShowCreateDispatch(false)}>✕</button>
            </div>

            <form onSubmit={submitDispatch} className="modal-body">
              <label className="field">
                <span>Demand Request ID</span>
                <input value={dispatchForm.demandRequestId} disabled />
              </label>

              <label className="field">
                <span>Quantity to Dispatch</span>
                <input
                  type="number"
                  step="0.01"
                  value={dispatchForm.quantityDispatched}
                  onChange={(e) => setDispatchForm((p) => ({ ...p, quantityDispatched: e.target.value }))}
                />
              </label>

              <label className="field">
                <span>Dispatch Date (optional)</span>
                <input
                  type="date"
                  value={dispatchForm.dispatchDate}
                  onChange={(e) => setDispatchForm((p) => ({ ...p, dispatchDate: e.target.value }))}
                />
              </label>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateDispatch(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingDispatch}>
                  {savingDispatch ? "Creating..." : "Create Dispatch"}
                </button>
              </div>

              <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
                If you see “Not enough stock”, add inventory lots first in Products tab.
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}