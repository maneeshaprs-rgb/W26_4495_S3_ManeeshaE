import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";
import {
  generateForecasts,
  getForecasts,
  getForecastModels,
} from "../assets/forecastApi";

export default function FarmerAnalytics() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const displayName = localStorage.getItem("displayName") || "Farmer";

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingRows, setLoadingRows] = useState(false);

  const [rows, setRows] = useState([]);
  const [models, setModels] = useState([]);

  const [form, setForm] = useState({
    forecastDate: new Date().toISOString().slice(0, 10),
    modelName: "MovingAverage",
    lookbackPeriods: 3,
    horizon: 7,
    granularity: "Daily",
  });

  const authHeaders = useMemo(() => {
    return {
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const loadModels = async () => {
    try {
      const data = await getForecastModels(token);
      setModels(data);
    } catch {
      setModels([]);
    }
  };

  const loadForecastRows = async () => {
    setLoadingRows(true);
    setError("");
    try {
      const data = await getForecasts(
        {
          forecastDate: form.forecastDate,
          modelName: form.modelName,
        },
        token
      );
      setRows(data);
    } catch (e) {
      setError(e?.message || "Failed to load forecasts");
    } finally {
      setLoadingRows(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload =
        form.modelName === "MovingAverage"
          ? {
              forecastDate: form.forecastDate,
              modelName: form.modelName,
              lookbackPeriods: Number(form.lookbackPeriods),
            }
          : {
              forecastDate: form.forecastDate,
              modelName: form.modelName,
              horizon: Number(form.horizon),
              granularity: form.granularity,
            };

      const result = await generateForecasts(payload, token);
      setSuccess(
        `Forecast generation completed. Model: ${result.modelName}, Rows: ${result.forecastCount}`
      );

      await loadModels();
      await loadForecastRows();
    } catch (e) {
      setError(e?.message || "Failed to generate forecasts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const run = async () => {
      await loadModels();
      await loadForecastRows();
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, navigate]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="sidebar-logo">FV</div>
            <div>
              <div className="sidebar-title">FarmVendor</div>
              <div className="sidebar-subtitle">Farmer Panel</div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="sidebar-link" onClick={() => navigate("/farmer/dashboard")}>
              Dashboard
            </div>
            <div className="sidebar-link" onClick={() => navigate("/farmer/products")}>
              Products
            </div>
            <div className="sidebar-link" onClick={() => navigate("/farmer/requests")}>
              Requests
            </div>
            <div className="sidebar-link" onClick={() => navigate("/farmer/dispatch")}>
              Dispatch
            </div>
            <div className="sidebar-link active">Analytics</div>
            <div className="sidebar-link" onClick={logout}>
              Logout
            </div>
          </nav>
        </aside>

        <main className="main">
          <div className="main-inner">
            <div className="topbar">
              <div>
                <h1>Forecast Analytics</h1>
                <div className="sub">Generate and view demand forecasts for dispatch planning</div>
              </div>
              <div className="topbar-right">
                <span className="pill">User: {displayName}</span>
                <button className="btn btn-secondary" onClick={logout}>
                  Logout
                </button>
              </div>
            </div>

            {error && <div className="auth-alert error">{error}</div>}
            {success && <div className="auth-alert success">{success}</div>}

            <section className="grid-sections" style={{ marginTop: 14 }}>
              <div className="card">
                <div className="card-header">
                  <h2>Generate Forecast</h2>
                </div>

                <div className="card-body">
                  <form onSubmit={handleGenerate} className="modal-body" style={{ padding: 0 }}>
                    <label className="field">
                      <span>Forecast Date</span>
                      <input
                        type="date"
                        value={form.forecastDate}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, forecastDate: e.target.value }))
                        }
                      />
                    </label>

                    <label className="field">
                      <span>Model</span>
                      <select
                        value={form.modelName}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, modelName: e.target.value }))
                        }
                      >
                        <option value="MovingAverage">MovingAverage</option>
                        <option value="MLNET_SSA">MLNET_SSA</option>
                      </select>
                    </label>

                    {form.modelName === "MovingAverage" ? (
                      <label className="field">
                        <span>Lookback Periods</span>
                        <input
                          type="number"
                          min="1"
                          value={form.lookbackPeriods}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              lookbackPeriods: e.target.value,
                            }))
                          }
                        />
                      </label>
                    ) : (
                      <>
                        <label className="field">
                          <span>Horizon</span>
                          <input
                            type="number"
                            min="1"
                            value={form.horizon}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                horizon: e.target.value,
                              }))
                            }
                          />
                        </label>

                        <label className="field">
                          <span>Granularity</span>
                          <select
                            value={form.granularity}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                granularity: e.target.value,
                              }))
                            }
                          >
                            <option value="Daily">Daily</option>
                            <option value="Weekly">Weekly</option>
                          </select>
                        </label>
                      </>
                    )}

                    <div className="modal-actions" style={{ justifyContent: "flex-start" }}>
                      <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? "Generating..." : "Generate Forecast"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={loadForecastRows}
                        disabled={loadingRows}
                      >
                        {loadingRows ? "Loading..." : "Refresh Results"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h2>Available Model Names</h2>
                </div>
                <div className="card-body">
                  {models.length === 0 ? (
                    <div>No models found yet.</div>
                  ) : (
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {models.map((m) => (
                        <span key={m} className="badge badge-green">
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section style={{ marginTop: 14 }}>
              <div className="card">
                <div className="card-header">
                  <h2>Forecast Results</h2>
                  <button className="btn btn-secondary" onClick={loadForecastRows}>
                    Refresh
                  </button>
                </div>

                <div className="card-body">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Vendor</th>
                        <th>Product</th>
                        <th>Forecast Date</th>
                        <th>Qty</th>
                        <th>Model</th>
                        <th>Lookback</th>
                        <th>Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan="8">No forecast rows found.</td>
                        </tr>
                      ) : (
                        rows.map((r) => (
                          <tr key={r.demandForecastId}>
                            <td>{r.demandForecastId}</td>
                            <td>{r.vendorId}</td>
                            <td>{r.productName}</td>
                            <td>{new Date(r.forecastDate).toISOString().slice(0, 10)}</td>
                            <td>{r.forecastQty}</td>
                            <td>{r.modelName}</td>
                            <td>{r.lookbackPeriods ?? "-"}</td>
                            <td>{new Date(r.createdAt).toISOString().slice(0, 10)}</td>
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