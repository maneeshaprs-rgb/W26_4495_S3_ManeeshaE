import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getMyProfile, updateMyProfile } from "../assets/profileApi";
import { getBrowserLocation } from "../assets/locationUtils";
import FarmerSidebar from "../assets/components/FarmerSidebar";
import VendorSidebar from "../assets/components/VendorSidebar";


import "../styles/dashboard.css";

export default function ProfileSetup() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    displayName: "",
    city: "",
    province: "",
    postalCode: "",
    latitude: "",
    longitude: "",
  });

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const load = async () => {
      try {
        const data = await getMyProfile(token);

        setForm({
          displayName: data.displayName || "",
          city: data.city || "",
          province: data.province || "",
          postalCode: data.postalCode || "",
          latitude: data.latitude ?? "",
          longitude: data.longitude ?? "",
        });
      } catch (e) {
        setError(e?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, navigate]);

  const onChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const useCurrentLocation = async () => {
    setError("");
    setSuccess("");
    setLocating(true);

    try {
      const loc = await getBrowserLocation();
      setForm((prev) => ({
        ...prev,
        latitude: loc.latitude,
        longitude: loc.longitude,
      }));
      setSuccess("Current location added successfully.");
    } catch (e) {
      setError(e?.message || "Failed to get current location");
    } finally {
      setLocating(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const payload = {
        displayName: form.displayName,
        city: form.city,
        province: form.province,
        postalCode: form.postalCode,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      };

      const data = await updateMyProfile(payload, token);

      localStorage.setItem("displayName", data.displayName);
      localStorage.setItem("profileComplete", String(data.profileComplete));

      setSuccess("Profile updated successfully.");

      setTimeout(() => {
        navigate(role === "Vendor" ? "/vendor" : "/farmer");
      }, 700);
    } catch (e) {
      setError(e?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const Sidebar = role === "Vendor" ? VendorSidebar : FarmerSidebar;

  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        <Sidebar active="Profile" />

        <main className="main">
          <div className="main-inner">
            <div className="topbar">
              <div>
                <h1>Profile Setup</h1>
                <div className="sub">
                  Complete your profile to improve recommendations and dispatch planning.
                </div>
              </div>
            </div>

            {error && <div className="auth-alert error">{error}</div>}
            {success && <div className="auth-alert success">{success}</div>}

            <section style={{ marginTop: 14 }}>
              <div className="card" style={{ maxWidth: 820 }}>
                <div className="card-header">
                  <h2>My Profile</h2>
                </div>

                <div className="card-body">
                  {loading ? (
                    <div>Loading profile...</div>
                  ) : (
                    <form onSubmit={handleSave} className="modal-body" style={{ padding: 0 }}>
                      <label className="field">
                        <span>Display Name</span>
                        <input
                          name="displayName"
                          value={form.displayName}
                          onChange={onChange}
                          required
                        />
                      </label>

                      <label className="field">
                        <span>City</span>
                        <input
                          name="city"
                          value={form.city}
                          onChange={onChange}
                          required
                        />
                      </label>

                      <label className="field">
                        <span>Province</span>
                        <input
                          name="province"
                          value={form.province}
                          onChange={onChange}
                          required
                        />
                      </label>

                      <label className="field">
                        <span>Postal Code</span>
                        <input
                          name="postalCode"
                          value={form.postalCode}
                          onChange={onChange}
                          required
                        />
                      </label>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <label className="field">
                          <span>Latitude</span>
                          <input
                            name="latitude"
                            type="number"
                            step="0.000001"
                            value={form.latitude}
                            onChange={onChange}
                            required
                          />
                        </label>

                        <label className="field">
                          <span>Longitude</span>
                          <input
                            name="longitude"
                            type="number"
                            step="0.000001"
                            value={form.longitude}
                            onChange={onChange}
                            required
                          />
                        </label>
                      </div>

                      <div className="modal-actions" style={{ justifyContent: "flex-start" }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={useCurrentLocation}
                          disabled={locating}
                        >
                          {locating ? "Locating..." : "Use Current Location"}
                        </button>

                        <button type="submit" className="btn btn-primary" disabled={saving}>
                          {saving ? "Saving..." : "Save Profile"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}