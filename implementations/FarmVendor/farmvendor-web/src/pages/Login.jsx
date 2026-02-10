import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/dashboard.css";

const API_BASE = "https://localhost:7057"; // This need to be change later before live
const USE_MOCK = true; // set false when backend is running

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
        // Mock login: decide role by email
        const role = form.email.toLowerCase().includes("vendor") ? "Vendor" : "Farmer";
        localStorage.setItem("token", "mock-jwt-token");
        localStorage.setItem("role", role);
        localStorage.setItem("displayName", role === "Vendor" ? "Vendor User" : "Farmer User");
        navigate(role === "Vendor" ? "/vendor" : "/farmer");
        return;
      }

      const res = await fetch(`${API_BASE}/api/auth/login`, {
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
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("displayName", data.displayName);

      navigate(data.role === "Vendor" ? "/vendor" : "/farmer");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div className="card">
        <h2 style={styles.title}>Login</h2>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleLogin} style={styles.form}>
          <label style={styles.label}>
            Email
            <input
              style={styles.input}
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              required
              placeholder="farmer1@test.com"
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              style={styles.input}
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              required
              placeholder="Your password"
            />
          </label>

          <button style={styles.button} disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <p style={styles.smallText}>
          Don’t have an account? <Link to="/register">Register</Link>
        </p>

        <p style={styles.hint}>
          Mock mode is <b>{USE_MOCK ? "ON" : "OFF"}</b>. (Turn it OFF when backend runs.)
        </p>
      </div>
      <button onClick={() => navigate("/farmer")}>
         Go to Farmer Dashboard
      </button>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 },
  card: { width: 380, border: "1px solid #ddd", borderRadius: 12, padding: 20 },
  title: { margin: "0 0 12px 0" },
  form: { display: "grid", gap: 12 },
  label: { display: "grid", gap: 6, fontSize: 14 },
  input: { padding: 10, borderRadius: 8, border: "1px solid #ccc" },
  button: { padding: 10, borderRadius: 8, border: "none", cursor: "pointer" },
  error: { background: "#ffe6e6", padding: 10, borderRadius: 8, marginBottom: 10 },
  smallText: { marginTop: 12, fontSize: 14 },
  hint: { marginTop: 8, fontSize: 12, color: "#555" },
};
