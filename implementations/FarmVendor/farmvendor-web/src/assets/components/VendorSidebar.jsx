import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function VendorSidebar() {
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
          <div className="sidebar-subtitle">Vendor Panel</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div
          className={`sidebar-link ${isActive("/vendor") ? "active" : ""}`}
          onClick={() => navigate("/vendor")}
        >
          Dashboard
        </div>

        <div
          className={`sidebar-link ${isActive("/vendor/stock") ? "active" : ""}`}
          onClick={() => navigate("/vendor/stock")}
        >
          Stock
        </div>

        <div
          className={`sidebar-link ${isActive("/vendor/requests") ? "active" : ""}`}
          onClick={() => navigate("/vendor/requests")}
        >
          Requests
        </div>

        <div
          className={`sidebar-link ${isActive("/vendor/incoming") ? "active" : ""}`}
          onClick={() => navigate("/vendor/incoming")}
        >
          Incoming
        </div>

        <div
          className={`sidebar-link ${isActive("/vendor/analytics") ? "active" : ""}`}
          onClick={() => navigate("/vendor/analytics")}
        >
          Analytics
        </div>

        <div
          className={`sidebar-link ${isActive("/vendor/forecasts") ? "active" : ""}`}
          onClick={() => navigate("/vendor/forecasts")}
        >
          Forecast
        </div>

        <div
          className={`sidebar-link ${isActive("/vendor/chat") ? "active" : ""}`}
          onClick={() => navigate("/vendor/chat")}
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