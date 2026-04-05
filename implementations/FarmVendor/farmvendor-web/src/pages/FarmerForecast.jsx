import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";
import {
  generateForecasts,
  getForecasts,
  getForecastModels,
  getForecastChartData,
  getForecastVendors,
  getForecastProducts,
} from "../assets/forecastApi";
import ForecastLineChart from "../assets/components/ForecastLineChart";
import FarmerSidebar from "../assets/components/FarmerSidebar";

export default function FarmerAnalytics() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const displayName = localStorage.getItem("displayName") || "Farmer";

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingRows, setLoadingRows] = useState(false);
  const [loadingChart, setLoadingChart] = useState(false);

  const [rows, setRows] = useState([]);
  const [models, setModels] = useState([]);
  const [chartData, setChartData] = useState([]);

  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);

  const [vendorSearch, setVendorSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [bootstrappedDefaults, setBootstrappedDefaults] = useState(false);

  const [form, setForm] = useState({
    forecastDate: new Date().toISOString().slice(0, 10),
    modelName: "MLNET_SSA",
    lookbackPeriods: 3,
    horizon: 7,
    granularity: "Daily",
    vendorId: "",
  });

  const [chartForm, setChartForm] = useState({
    vendorId: "",
    productId: "",
    forecastDate: new Date().toISOString().slice(0, 10),
  });

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

  const loadForecastRows = async (forecastDateArg, modelNameArg) => {
    setLoadingRows(true);
    setError("");
    try {
      const data = await getForecasts(
        {
          forecastDate: forecastDateArg || form.forecastDate,
          modelName: modelNameArg || form.modelName,
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

  const loadVendors = async (search = "") => {
    try {
      const data = await getForecastVendors(token, search);
      setVendors(data);
    } catch {
      setVendors([]);
    }
  };

  const loadProducts = async (search = "") => {
    try {
      const data = await getForecastProducts(token, search);
      setProducts(data);
    } catch {
      setProducts([]);
    }
  };

  const handleGenerate = async () => {
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
              vendorId: form.vendorId || null,
            }
          : {
              forecastDate: form.forecastDate,
              modelName: form.modelName,
              horizon: Number(form.horizon),
              granularity: form.granularity,
              vendorId: form.vendorId || null,
            };

      const result = await generateForecasts(payload, token);

      setSuccess(
        `Forecast generation completed. Model: ${result.modelName}, Rows: ${result.forecastCount}`
      );

      await loadModels();
      await loadForecastRows(form.forecastDate, form.modelName);

      if (chartForm.vendorId && chartForm.productId) {
        await loadChart({
          vendorId: chartForm.vendorId,
          productId: chartForm.productId,
          forecastDate: form.forecastDate,
        });
      }
    } catch (e) {
      setError(e?.message || "Failed to generate forecasts");
    } finally {
      setLoading(false);
    }
  };

  const loadChart = async (override = null) => {
    const payload = override || chartForm;

    setError("");
    setLoadingChart(true);
    setChartData([]);

    if (!payload.vendorId || !payload.productId) {
      setError("Please select vendor and product.");
      setLoadingChart(false);
      return;
    }

    try {
      const data = await getForecastChartData(
        {
          vendorId: payload.vendorId,
          productId: Number(payload.productId),
          forecastDate: payload.forecastDate,
          modelName: "MLNET_SSA",
        },
        token
      );
      setChartData(data);
    } catch (e) {
      setError(e?.message || "Failed to load chart");
    } finally {
      setLoadingChart(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const run = async () => {
      await loadModels();
      await loadForecastRows(form.forecastDate, "MLNET_SSA");
      await loadVendors();
      await loadProducts();
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadVendors(vendorSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [vendorSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts(productSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  useEffect(() => {
    if (!bootstrappedDefaults && vendors.length > 0 && products.length > 0) {
      const defaultVendorId = vendors[0]?.id || "";
      const defaultProductId = products[0]?.productId || "";
      const today = new Date().toISOString().slice(0, 10);

      setForm((prev) => ({
        ...prev,
        vendorId: defaultVendorId,
        forecastDate: today,
        modelName: "MovingAverage",
        horizon: 7,
        granularity: "Daily",
      }));

      setChartForm({
        vendorId: defaultVendorId,
        productId: String(defaultProductId),
        forecastDate: today,
      });

      setBootstrappedDefaults(true);
    }
  }, [vendors, products, bootstrappedDefaults]);

  useEffect(() => {
    if (bootstrappedDefaults && chartForm.vendorId && chartForm.productId) {
      loadChart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootstrappedDefaults, chartForm.vendorId, chartForm.productId, chartForm.forecastDate]);

  const selectedVendorName =
    vendors.find((v) => String(v.id) === String(chartForm.vendorId))?.displayName || "-";

  const selectedProductName =
    products.find((p) => String(p.productId) === String(chartForm.productId))?.name || "-";

  const summary = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return {
        total: 0,
        average: 0,
        peakDate: "-",
        trend: "-",
      };
    }

    const forecastOnly = chartData.filter((p) => p.series === "Forecast");
    const total = forecastOnly.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
    const average = forecastOnly.length > 0 ? total / forecastOnly.length : 0;

    let peakDate = "-";
    if (forecastOnly.length > 0) {
      const peak = [...forecastOnly].sort((a, b) => Number(b.quantity) - Number(a.quantity))[0];
      peakDate = peak?.date || "-";
    }

    let trend = "-";
    if (forecastOnly.length >= 2) {
      const first = Number(forecastOnly[0].quantity || 0);
      const last = Number(forecastOnly[forecastOnly.length - 1].quantity || 0);
      if (last > first) trend = "Increasing";
      else if (last < first) trend = "Decreasing";
      else trend = "Stable";
    }

    return {
      total: total.toFixed(2),
      average: average.toFixed(2),
      peakDate,
      trend,
    };
  }, [chartData]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        <FarmerSidebar />

        <main className="main">
          <div className="main-inner">
            <div className="topbar">
              <div>
                <h1>Demand Forecast Dashboard</h1>
                <div className="sub">
                  Auto-loaded forecast view using MLNET_SSA with 7-day horizon
                </div>
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

            <section className="forecast-kpis" style={{ marginTop: 14 }}>
              <div className="forecast-kpi-card">
                <div className="forecast-kpi-label">Model</div>
                <div className="forecast-kpi-value">MLNET_SSA</div>
              </div>
              <div className="forecast-kpi-card">
                <div className="forecast-kpi-label">Horizon</div>
                <div className="forecast-kpi-value">7 Days</div>
              </div>
              <div className="forecast-kpi-card">
                <div className="forecast-kpi-label">Total Forecast</div>
                <div className="forecast-kpi-value">{summary.total}</div>
              </div>
              <div className="forecast-kpi-card">
                <div className="forecast-kpi-label">Trend</div>
                <div className="forecast-kpi-value">{summary.trend}</div>
              </div>
            </section>

            <section style={{ marginTop: 14 }}>
              <div className="card">
                <div className="card-header">
                  <h2>Forecast Chart</h2>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setAdvancedOpen((prev) => !prev)}
                  >
                    {advancedOpen ? "Hide Advanced Settings" : "Show Advanced Settings"}
                  </button>
                </div>

                <div className="card-body">
                  <div className="forecast-selection-summary">
                    <span><b>Vendor:</b> {selectedVendorName}</span>
                    <span><b>Product:</b> {selectedProductName}</span>
                    <span><b>Date:</b> {chartForm.forecastDate}</span>
                    <span><b>Model:</b> MLNET_SSA</span>
                    <span><b>Horizon:</b> 7</span>
                  </div>

                  {advancedOpen && (
                    <div className="forecast-advanced-panel">
                      <div className="forecast-advanced-grid">
                        <label className="field">
                          <span>Search Vendor</span>
                          <input
                            value={vendorSearch}
                            onChange={(e) => setVendorSearch(e.target.value)}
                            placeholder="Search vendor by name or email"
                          />
                        </label>

                        <label className="field">
                          <span>Select Vendor</span>
                          <select
                            value={chartForm.vendorId}
                            onChange={(e) => {
                              const vendorId = e.target.value;
                              setChartForm((prev) => ({ ...prev, vendorId }));
                              setForm((prev) => ({ ...prev, vendorId }));
                            }}
                          >
                            <option value="">-- Select Vendor --</option>
                            {vendors.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.displayName} ({v.email})
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="field">
                          <span>Search Product</span>
                          <input
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            placeholder="Search product by name"
                          />
                        </label>

                        <label className="field">
                          <span>Select Product</span>
                          <select
                            value={chartForm.productId}
                            onChange={(e) =>
                              setChartForm((prev) => ({ ...prev, productId: e.target.value }))
                            }
                          >
                            <option value="">-- Select Product --</option>
                            {products.map((p) => (
                              <option key={p.productId} value={p.productId}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="field">
                          <span>Forecast Date</span>
                          <input
                            type="date"
                            value={chartForm.forecastDate}
                            onChange={(e) => {
                              const date = e.target.value;
                              setChartForm((prev) => ({ ...prev, forecastDate: date }));
                              setForm((prev) => ({ ...prev, forecastDate: date }));
                            }}
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
                            <option value="MLNET_SSA">MLNET_SSA</option>
                            <option value="MovingAverage">MovingAverage</option>
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
                      </div>

                      <div className="modal-actions" style={{ justifyContent: "flex-start" }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={loading}
                          onClick={handleGenerate}
                        >
                          {loading ? "Generating..." : "Generate Forecast"}
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => loadForecastRows(form.forecastDate, form.modelName)}
                          disabled={loadingRows}
                        >
                          {loadingRows ? "Loading..." : "Refresh Results"}
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 20 }}>
                    {loadingChart ? (
                      <div className="auth-hint">Loading chart...</div>
                    ) : chartData.length > 0 ? (
                      <ForecastLineChart chartPoints={chartData} />
                    ) : (
                      <div className="auth-hint">No chart data available.</div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section style={{ marginTop: 14 }}>
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
                  <button
                    className="btn btn-secondary"
                    onClick={() => loadForecastRows(form.forecastDate, form.modelName)}
                  >
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