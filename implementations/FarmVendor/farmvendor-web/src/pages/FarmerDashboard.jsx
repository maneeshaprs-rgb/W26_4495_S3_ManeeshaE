import React from "react";
import { useNavigate } from "react-router-dom";

export default function Farmer_Dashboard() {
  const navigate = useNavigate();
  const displayName = localStorage.getItem("displayName") || "Farmer";

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("displayName");
    navigate("/login");
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h2>Farmer Dashboard</h2>
        <button onClick={logout} style={styles.button}>Logout</button>
      </header>

      <p>Welcome, <b>{displayName}</b> 👋</p>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h3>My Products</h3>
          <p>Add/edit vegetables, fruits, dairy available for dispatch.</p>
          <button style={styles.linkBtn}>Go to Products</button>
        </div>

        <div style={styles.card}>
          <h3>Vendor Demand Requests</h3>
          <p>See upcoming vendor requests (e.g., “Need 50kg onions next week”).</p>
          <button style={styles.linkBtn}>View Requests</button>
        </div>

        <div style={styles.card}>
          <h3>Dispatch Planning</h3>
          <p>Plan dispatch date, quantity, and pickup/delivery method.</p>
          <button style={styles.linkBtn}>Plan Dispatch</button>
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
