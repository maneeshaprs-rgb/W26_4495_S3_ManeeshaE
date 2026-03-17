import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/auth.css";

const API_BASE = import.meta.env.VITE_API_URL;
console.log("API_BASE =", API_BASE);
const USE_MOCK = false;

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (USE_MOCK) {
        const role = form.email.toLowerCase().includes("vendor") ? "Vendor" : "Farmer";

        localStorage.setItem("token", "mock-jwt-token");
        localStorage.setItem("role", role);
        localStorage.setItem("displayName", role === "Vendor" ? "Vendor User" : "Farmer User");
        localStorage.setItem("userId", role === "Vendor" ? "mock-vendor-id" : "mock-farmer-id");

        navigate(role === "Vendor" ? "/vendor" : "/farmer");
        return;
      }

      const res = await fetch(`${API_BASE}/api/Auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Login failed");
      }

      const data = await res.json();

      // Expecting: { token, role, displayName, userId }
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("displayName", data.displayName);
      localStorage.setItem("userId", data.userId);

      navigate(data.role === "Vendor" ? "/vendor" : "/farmer");
    } catch (err) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-brand">
            <div className="auth-logo">FV</div>
            <div>
              <div className="auth-title">FarmVendor</div>
              <div className="auth-subtitle">Farmer & Vendor Portal</div>
            </div>
          </div>

          <h2>Welcome back</h2>
          <p>Sign in to manage your stock, requests, and dispatch planning.</p>

          <div className="bullet">
            <ul>
              <li>Role-based access (Farmer / Vendor)</li>
              <li>Track inventory and vendor demand</li>
              <li>Plan dispatch and deliveries</li>
            </ul>
          </div>
        </div>

        <div className="auth-body">
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Login</h3>
          <div className="auth-hint">Use your email and password to continue.</div>

          {error && <div className="auth-alert error">{error}</div>}

          <form className="auth-form" onSubmit={handleLogin}>
            <label className="auth-label">
              Email
              <input
                className="auth-input"
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                required
                placeholder="farmer1@test.com"
                autoComplete="email"
              />
            </label>

            <label className="auth-label">
              Password
              <input
                className="auth-input"
                name="password"
                type="password"
                value={form.password}
                onChange={onChange}
                required
                placeholder="Your password"
                autoComplete="current-password"
              />
            </label>

            <button className="auth-btn primary" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </button>

            <div className="auth-extra">
              <button
                type="button"
                className="auth-btn secondary"
                onClick={() => navigate("/farmer")}
              >
                Go to Farmer Dashboard
              </button>
              <button
                type="button"
                className="auth-btn secondary"
                onClick={() => navigate("/vendor")}
              >
                Go to Vendor Dashboard
              </button>
            </div>
          </form>

          <div className="auth-footer">
            Don’t have an account? <Link to="/register">Register</Link>
          </div>
        </div>
      </div>
    </div>
  );
}