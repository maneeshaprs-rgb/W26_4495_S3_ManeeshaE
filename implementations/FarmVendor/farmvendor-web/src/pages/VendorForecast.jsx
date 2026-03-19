import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";
import {
  generateForecasts,
  getForecasts,
  compareForecasts,
  getForecastChartData,
} from "../assets/forecastApi";
import ForecastLineChart from "../assets/components/ForecastLineChart";
import VendorSidebar from "../assets/components/VendorSidebar";

const API_BASE = import.meta.env.VITE_API_URL;

export default function VendorAnalytics() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const displayName = localStorage.getItem("displayName") || "Vendor";

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [myRequests, setMyRequests] = useState([]);
  const [forecastRows, setForecastRows] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [chartData, setChartData] = useState([]);

  const [form, setForm] = useState({
    forecastDate: new Date().toISOString().slice(0, 10),
    modelName: "MovingAverage",
    lookbackPeriods: 3,
    horizon: 7,
    granularity: "Daily",
  });

  const [compareForm, setCompareForm] = useState({
    vendorId: "",
    productId: "",
    forecastDate: new Date().toISOString().slice(0, 10),
    lookbackPeriods: 3,
  });

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const loadMyRequests = async () => {
    const res = await fetch(`${API_BASE}/api/vendor/demandrequests?status=Open`, {
      headers: authHeaders,
    });

    const text = await res.text();
    if (!res.ok) throw new Error(text || "Failed to load vendor requests");

    const data = JSON.parse(text);
    setMyRequests(data);

    const vendorId = data?.[0]?.vendorId ?? "";
    const productId = data?.[0]?.productId ?? "";

    if (vendorId && productId) {
      setCompareForm((prev) => ({
        ...prev,
        vendorId,
        productId,
      }));
    }
  };

  const loadForecasts = async () => {
    try {
      const data = await getForecasts(
        {
          forecastDate: form.forecastDate,
          modelName: form.modelName,
        },
        token
      );
      setForecastRows(data);
    } catch (e) {
      setError(e?.message || "Failed to load forecasts");
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
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
      setSuccess(`Generated ${result.forecastCount} rows for ${result.modelName}`);
      await loadForecasts();
    } catch (e) {
      setError(e?.message || "Failed to generate forecasts");
    }
  };

  const handleCompare = async (e) => {
  e.preventDefault();
  setError("");
  setComparison(null);
  setChartData([]);

  try {
    const comparePayload = {
      vendorId: compareForm.vendorId,
      productId: Number(compareForm.productId),
      forecastDate: compareForm.forecastDate,
      lookbackPeriods: Number(compareForm.lookbackPeriods),
    };

    const compareResult = await compareForecasts(comparePayload, token);
    setComparison(compareResult);

    const chartResult = await getForecastChartData(
      {
        vendorId: compareForm.vendorId,
        productId: Number(compareForm.productId),
        forecastDate: compareForm.forecastDate,
        modelName: "MLNET_SSA",
      },
      token
    );

    setChartData(chartResult);

    if (!chartResult || chartResult.length === 0) {
      setError("No chart data found for this vendor/product/date.");
    }
  } catch (e) {
    setError(e?.message || "Failed to compare forecasts");
  }
};

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const run = async () => {
      try {
        await loadMyRequests();
        await loadForecasts();
      } catch (e) {
        setError(e?.message || "Failed to load analytics");
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, navigate]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        <VendorSidebar />

        <main className="main">
          <div className="main-inner">
            <div className="topbar">
              <div>
                <h1>Vendor Forecast Analytics</h1>
                <div className="sub">Generate forecasts and compare forecasting models</div>
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
                            setForm((prev) => ({ ...prev, lookbackPeriods: e.target.value }))
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
                              setForm((prev) => ({ ...prev, horizon: e.target.value }))
                            }
                          />
                        </label>

                        <label className="field">
                          <span>Granularity</span>
                          <select
                            value={form.granularity}
                            onChange={(e) =>
                              setForm((prev) => ({ ...prev, granularity: e.target.value }))
                            }
                          >
                            <option value="Daily">Daily</option>
                            <option value="Weekly">Weekly</option>
                          </select>
                        </label>
                      </>
                    )}

                    <div className="modal-actions" style={{ justifyContent: "flex-start" }}>
                      <button type="submit" className="btn btn-primary">
                        Generate
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={loadForecasts}>
                        Refresh
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h2>Compare Models</h2>
                </div>
                <div className="card-body">
                  <form onSubmit={handleCompare} className="modal-body" style={{ padding: 0 }}>
                    <label className="field">
                      <span>Vendor ID</span>
                      <input
                        value={compareForm.vendorId}
                        onChange={(e) =>
                          setCompareForm((prev) => ({ ...prev, vendorId: e.target.value }))
                        }
                      />
                    </label>

                    <label className="field">
                      <span>Product ID</span>
                      <input
                        type="number"
                        value={compareForm.productId}
                        onChange={(e) =>
                          setCompareForm((prev) => ({ ...prev, productId: e.target.value }))
                        }
                      />
                    </label>

                    <label className="field">
                      <span>Forecast Date</span>
                      <input
                        type="date"
                        value={compareForm.forecastDate}
                        onChange={(e) =>
                          setCompareForm((prev) => ({ ...prev, forecastDate: e.target.value }))
                        }
                      />
                    </label>

                    <label className="field">
                      <span>Lookback Periods</span>
                      <input
                        type="number"
                        value={compareForm.lookbackPeriods}
                        onChange={(e) =>
                          setCompareForm((prev) => ({
                            ...prev,
                            lookbackPeriods: e.target.value,
                          }))
                        }
                      />
                    </label>

                    <div className="modal-actions" style={{ justifyContent: "flex-start" }}>
                      <button type="submit" className="btn btn-primary">
                        Compare
                      </button>
                    </div>
                  </form>

                  {comparison && (
                    <div style={{ marginTop: 14 }}>
                      <div className="badge badge-green" style={{ marginBottom: 8 }}>
                        Comparison Result
                      </div>
                      <div><b>Vendor:</b> {comparison.vendorId}</div>
                      <div><b>Product:</b> {comparison.productId}</div>
                      <div>
                        <b>Forecast Date:</b>{" "}
                        {new Date(comparison.forecastDate).toISOString().slice(0, 10)}
                      </div>
                      <div><b>Moving Average:</b> {comparison.movingAverageForecast}</div>
                      <div><b>ML.NET Forecast:</b> {comparison.mlNetForecast}</div>
                    </div>
                  )}

                  <div style={{ marginTop: 20 }}>
                  {chartData.length > 0 ? (
                    <ForecastLineChart chartPoints={chartData} />
                  ) : (
                    comparison && <div>No chart data available for this selection.</div>
                  )}
                </div>
                </div>
              </div>
            </section>

            <section style={{ marginTop: 14 }}>
              <div className="card">
                <div className="card-header">
                  <h2>Forecast Results</h2>
                </div>
                <div className="card-body">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Vendor</th>
                        <th>Product</th>
                        <th>Date</th>
                        <th>Qty</th>
                        <th>Model</th>
                        <th>Lookback</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecastRows.length === 0 ? (
                        <tr>
                          <td colSpan="7">No forecast rows found.</td>
                        </tr>
                      ) : (
                        forecastRows.map((r) => (
                          <tr key={r.demandForecastId}>
                            <td>{r.demandForecastId}</td>
                            <td>{r.vendorId}</td>
                            <td>{r.productName}</td>
                            <td>{new Date(r.forecastDate).toISOString().slice(0, 10)}</td>
                            <td>{r.forecastQty}</td>
                            <td>{r.modelName}</td>
                            <td>{r.lookbackPeriods ?? "-"}</td>
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