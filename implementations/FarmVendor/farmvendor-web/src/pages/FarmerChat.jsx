import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";
import ChatBox from "../assets/components/ChatBox";
import {
  createConversation,
  getMyConversations,
  getChatUsers,
} from "../assets/chatApi";

export default function FarmerChat() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const displayName = localStorage.getItem("displayName") || "Farmer";
  const currentUserId = localStorage.getItem("userId") || "";

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);

  const [vendors, setVendors] = useState([]);
  const [vendorSearch, setVendorSearch] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState("");

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const loadConversations = async () => {
    const data = await getMyConversations(token);
    setConversations(data);
    if (data.length > 0 && !selectedConversationId) {
      setSelectedConversationId(data[0].conversationId);
    }
  };

  const loadVendors = async (search = "") => {
    const data = await getChatUsers("Vendor", token, search);
    setVendors(data);
  };

  const handleCreateConversation = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedVendorId) {
      setError("Please select a vendor.");
      return;
    }

    try {
      const result = await createConversation(
        { vendorId: selectedVendorId },
        token
      );

      setSuccess("Conversation opened successfully.");
      setSelectedConversationId(result.conversationId);
      await loadConversations();
    } catch (e) {
      setError(e?.message || "Failed to create conversation");
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const run = async () => {
      try {
        setLoading(true);
        await loadConversations();
        await loadVendors();
      } catch (e) {
        setError(e?.message || "Failed to load chat");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [token, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadVendors(vendorSearch).catch(() => {});
    }, 300);

    return () => clearTimeout(timer);
  }, [vendorSearch]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="sidebar-logo">FV</div>
            <div>
              <div className="sidebar-title">FarmVendor</div>
              <div className="sidebar-subtitle">Farmer Panel</div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="sidebar-link" onClick={() => navigate("/farmer/dashboard")}>Dashboard</div>
            <div className="sidebar-link" onClick={() => navigate("/farmer/products")}>Products</div>
            <div className="sidebar-link" onClick={() => navigate("/farmer/requests")}>Requests</div>
            <div className="sidebar-link" onClick={() => navigate("/farmer/dispatch")}>Dispatch</div>
            <div className="sidebar-link" onClick={() => navigate("/farmer/analytics")}>Analytics</div>
            <div className="sidebar-link active">Chat</div>
            <div className="sidebar-link" onClick={logout}>Logout</div>
          </nav>
        </aside>

        <main className="main">
          <div className="main-inner">
            <div className="topbar">
              <div>
                <h1>Farmer Chat</h1>
                <div className="sub">Communicate with vendors in real time</div>
              </div>
              <div className="topbar-right">
                <span className="pill">User: {displayName}</span>
                <button className="btn btn-secondary" onClick={logout}>Logout</button>
              </div>
            </div>

            {error && <div className="auth-alert error">{error}</div>}
            {success && <div className="auth-alert success">{success}</div>}
            {loading && <div className="auth-hint">Loading chat...</div>}

            <section className="grid-sections" style={{ marginTop: 14 }}>
              <div className="card">
                <div className="card-header">
                  <h2>Open Conversation</h2>
                </div>

                <div className="card-body">
                  <form onSubmit={handleCreateConversation} className="modal-body" style={{ padding: 0 }}>
                    <label className="field">
                      <span>Search Vendor</span>
                      <input
                        value={vendorSearch}
                        onChange={(e) => setVendorSearch(e.target.value)}
                        placeholder="Search by name or email"
                      />
                    </label>

                    <label className="field">
                      <span>Select Vendor</span>
                      <select
                        value={selectedVendorId}
                        onChange={(e) => setSelectedVendorId(e.target.value)}
                      >
                        <option value="">-- Select Vendor --</option>
                        {vendors.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.displayName} ({v.email})
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="modal-actions" style={{ justifyContent: "flex-start" }}>
                      <button type="submit" className="btn btn-primary">Open Chat</button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h2>My Conversations</h2>
                </div>

                <div className="card-body">
                  {conversations.length === 0 ? (
                    <div>No conversations yet.</div>
                  ) : (
                    <div style={{ display: "grid", gap: 10 }}>
                      {conversations.map((c) => (
                        <button
                          key={c.conversationId}
                          className="btn btn-secondary"
                          style={{
                            textAlign: "left",
                            border: selectedConversationId === c.conversationId ? "2px solid #2f855a" : undefined,
                          }}
                          onClick={() => setSelectedConversationId(c.conversationId)}
                        >
                          <div><b>Conversation #{c.conversationId}</b></div>
                          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                            Vendor: {c.vendorId}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section style={{ marginTop: 14 }}>
              {selectedConversationId ? (
                <ChatBox
                  conversationId={selectedConversationId}
                  token={token}
                  currentUserId={currentUserId}
                />
              ) : (
                <div className="card">
                  <div className="card-body">Select or create a conversation to start chatting.</div>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}