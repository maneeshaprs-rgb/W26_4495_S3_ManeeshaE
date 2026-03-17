import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";
import ChatBox from "../assets/components/ChatBox";
import { createConversation, getMyConversations } from "../assets/chatApi";

export default function VendorChat() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const displayName = localStorage.getItem("displayName") || "Vendor";
  const currentUserId = localStorage.getItem("userId") || localStorage.getItem("sub") || "";

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);

  const [createForm, setCreateForm] = useState({
    farmerId: "",
    vendorId: currentUserId,
  });

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const loadConversations = async () => {
    try {
      const data = await getMyConversations(token);
      setConversations(data);

      if (data.length > 0 && !selectedConversationId) {
        setSelectedConversationId(data[0].conversationId);
      }
    } catch (e) {
      setError(e?.message || "Failed to load conversations");
    }
  };

  const handleCreateConversation = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!createForm.farmerId.trim()) {
      setError("Farmer ID is required.");
      return;
    }

    try {
      const payload = {
        farmerId: createForm.farmerId.trim(),
        vendorId: currentUserId,
      };

      const result = await createConversation(payload, token);
      setSuccess("Conversation opened successfully.");
      setSelectedConversationId(result.conversationId);

      await loadConversations();

      setCreateForm((prev) => ({
        ...prev,
        farmerId: "",
      }));
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
      setLoading(true);
      setError("");
      try {
        await loadConversations();
      } finally {
        setLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, navigate]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="sidebar-logo">FV</div>
            <div>
              <div className="sidebar-title">FarmVendor</div>
              <div className="sidebar-subtitle">Vendor Panel</div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="sidebar-link" onClick={() => navigate("/vendor/dashboard")}>
              Dashboard
            </div>
            <div className="sidebar-link" onClick={() => navigate("/vendor/stock")}>
              Stock
            </div>
            <div className="sidebar-link" onClick={() => navigate("/vendor/requests")}>
              Requests
            </div>
            <div className="sidebar-link" onClick={() => navigate("/vendor/incoming")}>
              Incoming
            </div>
            <div className="sidebar-link" onClick={() => navigate("/vendor/analytics")}>
              Analytics
            </div>
            <div className="sidebar-link active">Chat</div>
            <div className="sidebar-link" onClick={logout}>
              Logout
            </div>
          </nav>
        </aside>

        <main className="main">
          <div className="main-inner">
            <div className="topbar">
              <div>
                <h1>Vendor Chat</h1>
                <div className="sub">Communicate with farmers in real time</div>
              </div>
              <div className="topbar-right">
                <span className="pill">User: {displayName}</span>
                <button className="btn btn-secondary" onClick={logout}>
                  Logout
                </button>
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
                      <span>Farmer ID</span>
                      <input
                        value={createForm.farmerId}
                        onChange={(e) =>
                          setCreateForm((prev) => ({ ...prev, farmerId: e.target.value }))
                        }
                        placeholder="Enter farmer user ID"
                      />
                    </label>

                    <div className="modal-actions" style={{ justifyContent: "flex-start" }}>
                      <button type="submit" className="btn btn-primary">
                        Open Chat
                      </button>
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
                            border:
                              selectedConversationId === c.conversationId
                                ? "2px solid #2f855a"
                                : undefined,
                          }}
                          onClick={() => setSelectedConversationId(c.conversationId)}
                        >
                          <div><b>Conversation #{c.conversationId}</b></div>
                          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                            Farmer: {c.farmerId}
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