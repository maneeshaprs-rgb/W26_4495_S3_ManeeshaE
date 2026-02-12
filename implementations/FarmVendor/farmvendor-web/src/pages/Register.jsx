import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/auth.css";

const API_BASE = "https://localhost:7057";
const USE_MOCK = true; // set false when backend is running

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
    role: "Farmer",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (USE_MOCK) {
        setSuccess("Registered successfully (mock). You can login now.");
        setTimeout(() => navigate("/login"), 800);
        return;
      }

      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Registration failed");
      }

      setSuccess("Registered successfully. Please login.");
      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Left panel */}
        <div className="auth-header">
          <div className="auth-brand">
            <div className="auth-logo">FV</div>
            <div>
              <div className="auth-title">FarmVendor</div>
              <div className="auth-subtitle">Farmer & Vendor Portal</div>
            </div>
          </div>

          <h2>Create your account</h2>
          <p>Register as a Farmer or Vendor to start using the platform.</p>

          <div className="bullet">
            <ul>
              <li>Create demand requests (Vendor)</li>
              <li>Add product lots and plan dispatch (Farmer)</li>
              <li>Secure login with role-based access</li>
            </ul>
          </div>
        </div>

        {/* Right panel */}
        <div className="auth-body">
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Register</h3>
          <div className="auth-hint">Fill the form below to create an account.</div>

          {error && <div className="auth-alert error">{error}</div>}
          {success && <div className="auth-alert success">{success}</div>}

          <form className="auth-form" onSubmit={handleRegister}>
            <label className="auth-label">
              Display Name
              <input
                className="auth-input"
                name="displayName"
                value={form.displayName}
                onChange={onChange}
                required
                placeholder="Maneesha"
                autoComplete="name"
              />
            </label>

            <label className="auth-label">
              Email
              <input
                className="auth-input"
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                required
                placeholder="vendor1@test.com"
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
                placeholder="Min 6 characters"
                autoComplete="new-password"
              />
            </label>

            <label className="auth-label">
              Role
              <select
                className="auth-select"
                name="role"
                value={form.role}
                onChange={onChange}
              >
                <option value="Farmer">Farmer</option>
                <option value="Vendor">Vendor</option>
              </select>
            </label>

            <button className="auth-btn primary" disabled={loading}>
              {loading ? "Creating..." : "Register"}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Login</Link>
          </div>

          <div className="auth-hint" style={{ marginTop: 6 }}>
            Mock mode is <b>{USE_MOCK ? "ON" : "OFF"}</b>. (Turn it OFF when backend runs.)
          </div>
        </div>
      </div>
    </div>
  );
}
