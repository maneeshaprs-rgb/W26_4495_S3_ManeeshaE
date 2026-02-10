import React from "react";
import { useNavigate } from "react-router-dom";

export default function Vendor_Dashboard() {
  const navigate = useNavigate();
  const displayName = localStorage.getItem("displayName") || "Vendor";

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("displayName");
    navigate("/login");
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h2>Vendor Dashboard</h2>
        <button onClick={logout} style={styles.button}>Logout</button>
      </header>

      <p>Welcome, <b>{displayName}</b> 👋</p>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h3>Current Stock</h3>
          <p>Track inventory levels for vegetables, fruits, dairy.</p>
          <button style={styles.linkBtn}>View Stock</button>
        </div>

        <div style={styles.card}>
          <h3>Create Demand Request</h3>
          <p>Create requests like “Need 50kg onions next week”.</p>
          <button style={styles.linkBtn}>Create Request</button>
        </div>

        <div style={styles.card}>
          <h3>Incoming Dispatches</h3>
          <p>See what farmers plan to deliver and expected dates.</p>
          <button style={styles.linkBtn}>View Dispatches</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: 20, maxWidth: 900, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  grid: { display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginTop: 16 },
  card: { border: "1px solid #ddd", borderRadius: 12, padding: 16 },
  button: { padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc", cursor: "pointer" },
  linkBtn: { padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer" },
};
