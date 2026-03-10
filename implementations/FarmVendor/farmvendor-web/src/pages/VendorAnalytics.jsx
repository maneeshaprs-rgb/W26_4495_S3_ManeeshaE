import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

const API_BASE = import.meta.env.VITE_API_URL;

export default function VendorAnalytics() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const displayName = localStorage.getItem("displayName") || "Vendor";

  const [error, setError] = useState("");
  const [forecastDate, setForecastDate] = useState("2026-03-10");
  const [planDate, setPlanDate] = useState("2026-03-10");

  const [forecasts, setForecasts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [relationshipStats, setRelationshipStats] = useState([]);

  const [runningForecast, setRunningForecast] = useState(false);
  const [runningOptimization, setRunningOptimization] = useState(false);

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

  const loadForecasts = async () => {
    const res = await fetch(
      `${API_BASE}/api/forecasts?forecastDate=${forecastDate}`,
      { headers: authHeaders }
    );
    const text = await res.text();
    if (!res.ok) throw new Error(text || "Failed to load forecasts");
    setForecasts(JSON.parse(text));
  };

  const loadPlans = async () => {
    const res = await fetch(
      `${API_BASE}/api/optimization/plans?planDate=${planDate}`,
      { headers: authHeaders }
    );
    const text = await res.text();
    if (!res.ok) throw new Error(text || "Failed to load plans");
    setPlans(JSON.parse(text));
  };

  const loadRelationshipStats = async () => {
    const res = await fetch(`${API_BASE}/api/relationshipstats`, {
      headers: authHeaders,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(text || "Failed to load relationship stats");
    setRelationshipStats(JSON.parse(text));
  };

  const generateForecasts = async () => {
    setError("");
    setRunningForecast(true);
    try {
      const res = await fetch(`${API_BASE}/api/forecasts/generate`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          forecastDate: `${forecastDate}T00:00:00`,
          lookbackPeriods: 3,
        }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || "Failed to generate forecasts");

      await loadForecasts();
    } catch (e) {
      setError(e?.message || "Forecast generation failed");
    } finally {
      setRunningForecast(false);
    }
  };

  const runOptimization = async () => {
    setError("");
    setRunningOptimization(true);
    try {
      const res = await fetch(`${API_BASE}/api/optimization/run`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          planDate: `${planDate}T00:00:00`,
        }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || "Failed to run optimization");

      await loadPlans();
    } catch (e) {
      setError(e?.message || "Optimization failed");
    } finally {
      setRunningOptimization(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const run = async () => {
      try {
        setError("");
        await Promise.all([
          loadForecasts(),
          loadPlans(),
          loadRelationshipStats(),
        ]);
      } catch (e) {
        setError(e?.message || "Failed to load analytics");
      }
    };

    run();
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
            <div className="sidebar-link" onClick={() => navigate("/vendor/requests")}>Requests</div>
            <div className="sidebar-link" onClick={() => navigate("/vendor/incoming")}>Incoming</div>
            <div className="sidebar-link active">Analytics</div>
            <div className="sidebar-link" onClick={logout}>Logout</div>
          </nav>
        </aside>

        <main className="main">
          <div className="main-inner">
            <div className="topbar">
              <div>
                <h1>{displayName} — Analytics</h1>
                <div className="sub">Forecasts, optimization plans, and relationship scores</div>
              </div>
              <div className="topbar-right">
                <span className="pill">Role: Vendor</span>
                <button className="btn btn-secondary" onClick={logout}>Logout</button>
              </div>
            </div>

            {error && <div className="auth-alert error">{error}</div>}

            <section className="grid-sections" style={{ marginTop: 14 }}>
              <div className="card">
                <div className="card-header">
                  <h2>Demand Forecasts</h2>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="date"
                      value={forecastDate}
                      onChange={(e) => setForecastDate(e.target.value)}
                    />
                    <button className="btn btn-primary" onClick={generateForecasts} disabled={runningForecast}>
                      {runningForecast ? "Generating..." : "Generate"}
                    </button>
                    <button className="btn btn-secondary" onClick={loadForecasts}>Refresh</button>
                  </div>
                </div>
                <div className="card-body">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Vendor</th>
                        <th>Forecast Date</th>
                        <th>Forecast Qty</th>
                        <th>Model</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecasts.length === 0 ? (
                        <tr><td colSpan="5">No forecasts found.</td></tr>
                      ) : (
                        forecasts.map((f) => (
                          <tr key={f.demandForecastId}>
                            <td>{f.productName}</td>
                            <td>{f.vendorId}</td>
                            <td>{new Date(f.forecastDate).toISOString().slice(0, 10)}</td>
                            <td>{f.forecastQty}</td>
                            <td>{f.modelName}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h2>Recommended Dispatch Plans</h2>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="date"
                      value={planDate}
                      onChange={(e) => setPlanDate(e.target.value)}
                    />
                    <button className="btn btn-primary" onClick={runOptimization} disabled={runningOptimization}>
                      {runningOptimization ? "Running..." : "Run"}
                    </button>
                    <button className="btn btn-secondary" onClick={loadPlans}>Refresh</button>
                  </div>
                </div>
                <div className="card-body">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Farmer</th>
                        <th>Vendor</th>
                        <th>Product</th>
                        <th>Recommended Qty</th>
                        <th>Plan Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plans.length === 0 ? (
                        <tr><td colSpan="5">No plans found.</td></tr>
                      ) : (
                        plans.map((p) => (
                          <tr key={p.recommendedDispatchPlanId}>
                            <td>{p.farmerName || p.farmerId}</td>
                            <td>{p.vendorName || p.vendorId}</td>
                            <td>{p.productName}</td>
                            <td>{p.recommendedQty}</td>
                            <td>{new Date(p.planDate).toISOString().slice(0, 10)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section style={{ marginTop: 14 }}>
              <div className="card">
                <div className="card-header">
                  <h2>Relationship Scores</h2>
                  <button className="btn btn-secondary" onClick={loadRelationshipStats}>Refresh</button>
                </div>
                <div className="card-body">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Farmer</th>
                        <th>Vendor</th>
                        <th>Total Dispatches</th>
                        <th>Delivered</th>
                        <th>Cancelled</th>
                        <th>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relationshipStats.length === 0 ? (
                        <tr><td colSpan="6">No relationship stats found.</td></tr>
                      ) : (
                        relationshipStats.map((r) => (
                          <tr key={r.relationshipStatId}>
                            <td>{r.farmerName || r.farmerId}</td>
                            <td>{r.vendorName || r.vendorId}</td>
                            <td>{r.totalDispatches}</td>
                            <td>{r.deliveredCount}</td>
                            <td>{r.cancelledCount}</td>
                            <td>{r.relationshipScore}</td>
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
    </div>
  );
}