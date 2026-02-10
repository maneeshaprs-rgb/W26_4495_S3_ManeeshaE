import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = "https://localhost:7057";
const USE_MOCK = true; // set false when backend is running

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    displayName: "",
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
      setTimeout(() => navigate("/login"), 800);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Register</h2>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        <form onSubmit={handleRegister} style={styles.form}>
          <label style={styles.label}>
            Display Name
            <input
              style={styles.input}
              name="displayName"
              value={form.displayName}
              onChange={onChange}
              required
              placeholder="Maneesha"
            />
          </label>

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
              placeholder="Min 6 characters"
            />
          </label>

          <label style={styles.label}>
            Role
            <select style={styles.input} name="role" value={form.role} onChange={onChange}>
              <option value="Farmer">Farmer</option>
              <option value="Vendor">Vendor</option>
            </select>
          </label>

          <button style={styles.button} disabled={loading}>
            {loading ? "Creating..." : "Register"}
          </button>
        </form>

        <p style={styles.smallText}>
          Already have an account? <Link to="/login">Login</Link>
        </p>

        <p style={styles.hint}>
          Mock mode is <b>{USE_MOCK ? "ON" : "OFF"}</b>. (Turn it OFF when backend runs.)
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 },
  card: { width: 420, border: "1px solid #ddd", borderRadius: 12, padding: 20 },
  title: { margin: "0 0 12px 0" },
  form: { display: "grid", gap: 12 },
  label: { display: "grid", gap: 6, fontSize: 14 },
  input: { padding: 10, borderRadius: 8, border: "1px solid #ccc" },
  button: { padding: 10, borderRadius: 8, border: "none", cursor: "pointer" },
  error: { background: "#ffe6e6", padding: 10, borderRadius: 8, marginBottom: 10 },
  success: { background: "#e6ffea", padding: 10, borderRadius: 8, marginBottom: 10 },
  smallText: { marginTop: 12, fontSize: 14 },
  hint: { marginTop: 8, fontSize: 12, color: "#555" },
};
