import React, { useEffect, useState } from "react";
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

  const [rows, setRows] = useState([]);
  const [models, setModels] = useState([]);
  const [chartData, setChartData] = useState([]);

  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);

  const [vendorSearch, setVendorSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const [form, setForm] = useState({
    forecastDate: new Date().toISOString().slice(0, 10),
    modelName: "MovingAverage",
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
      await loadForecastRows();
    } catch (e) {
      setError(e?.message || "Failed to generate forecasts");
    } finally {
      setLoading(false);
    }
  };

  const loadChart = async () => {
    setError("");
    setChartData([]);

    if (!chartForm.vendorId || !chartForm.productId) {
      setError("Please select vendor and product.");
      return;
    }

    try {
      const data = await getForecastChartData(
        {
          vendorId: chartForm.vendorId,
          productId: Number(chartForm.productId),
          forecastDate: chartForm.forecastDate,
          modelName: "MLNET_SSA",
        },
        token
      );
      setChartData(data);
    } catch (e) {
      setError(e?.message || "Failed to load chart");
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

  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        <FarmerSidebar />

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
                        value={form.vendorId}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, vendorId: e.target.value }))
                        }
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
                  <h2>Forecast Chart</h2>
                </div>

                <div className="card-body">
                  <div className="modal-body" style={{ padding: 0 }}>
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
                        onChange={(e) =>
                          setChartForm((prev) => ({ ...prev, vendorId: e.target.value }))
                        }
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
                        onChange={(e) =>
                          setChartForm((prev) => ({ ...prev, forecastDate: e.target.value }))
                        }
                      />
                    </label>

                    <div className="modal-actions" style={{ justifyContent: "flex-start" }}>
                      <button type="button" className="btn btn-primary" onClick={loadChart}>
                        Load Chart
                      </button>
                    </div>
                  </div>

                  {chartData.length > 0 && (
                    <div style={{ marginTop: 20 }}>
                      <ForecastLineChart chartPoints={chartData} />
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