import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function FarmerSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">FV</div>
        <div>
          <div className="sidebar-title">FarmVendor</div>
          <div className="sidebar-subtitle">Farmer Panel</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div
          className={`sidebar-link ${isActive("/farmer/dashboard") ? "active" : ""}`}
          onClick={() => navigate("/farmer/dashboard")}
        >
          Dashboard
        </div>

        <div
          className={`sidebar-link ${isActive("/farmer/products") ? "active" : ""}`}
          onClick={() => navigate("/farmer/products")}
        >
          Products
        </div>

        <div
          className={`sidebar-link ${isActive("/farmer/requests") ? "active" : ""}`}
          onClick={() => navigate("/farmer/requests")}
        >
          Requests
        </div>

        <div
          className={`sidebar-link ${isActive("/farmer/dispatch") ? "active" : ""}`}
          onClick={() => navigate("/farmer/dispatch")}
        >
          Dispatch
        </div>

        <div
          className={`sidebar-link ${isActive("/farmer/analytics") ? "active" : ""}`}
          onClick={() => navigate("/farmer/analytics")}
        >
          Analytics
        </div>

        <div
          className={`sidebar-link ${isActive("/farmer/forecast") ? "active" : ""}`}
          onClick={() => navigate("/farmer/forecast")}
        >
          Forecast
        </div>

        <div
          className={`sidebar-link ${isActive("/farmer/chat") ? "active" : ""}`}
          onClick={() => navigate("/farmer/chat")}
        >
          Chat
        </div>

        <div className="sidebar-link" onClick={logout}>
          Logout
        </div>
      </nav>
    </aside>
  );
}