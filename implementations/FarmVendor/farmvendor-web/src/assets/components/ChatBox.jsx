import React, { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { getConversationMessages } from "../chatApi";

const API_BASE = import.meta.env.VITE_API_URL;

export default function ChatBox({ conversationId, token, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [connection, setConnection] = useState(null);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!conversationId || !token) return;

    const load = async () => {
      try {
        const existing = await getConversationMessages(conversationId, token);
        setMessages(existing);
      } catch (e) {
        setError(e?.message || "Failed to load messages");
      }
    };

    load();
  }, [conversationId, token]);

  useEffect(() => {
    if (!conversationId || !token) return;

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE}/hubs/chat`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);

    return () => {
      newConnection.stop();
    };
  }, [conversationId, token]);

  useEffect(() => {
    if (!connection) return;

    connection
      .start()
      .then(async () => {
        await connection.invoke("JoinConversation", `conversation-${conversationId}`);

        connection.on("ReceiveMessage", (message) => {
          setMessages((prev) => [...prev, message]);
        });
      })
      .catch((err) => setError(err.message));

    return () => {
      if (connection) {
        connection.off("ReceiveMessage");
      }
    };
  }, [connection, conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim() || !connection) return;

    try {
      await connection.invoke("SendMessage", conversationId, text.trim());
      setText("");
    } catch (e) {
      setError(e?.message || "Failed to send message");
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Chat</h2>
      </div>

      <div className="card-body">
        {error && <div className="auth-alert error">{error}</div>}

        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            height: 320,
            overflowY: "auto",
            padding: 12,
            background: "#fafafa",
            marginBottom: 12,
          }}
        >
          {messages.length === 0 ? (
            <div>No messages yet.</div>
          ) : (
            messages.map((m) => {
              const mine = m.senderId === currentUserId;
              return (
                <div
                  key={m.chatMessageId}
                  style={{
                    display: "flex",
                    justifyContent: mine ? "flex-end" : "flex-start",
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      maxWidth: "70%",
                      background: mine ? "#dcfce7" : "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: "8px 12px",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                      {m.senderRole}
                    </div>
                    <div>{m.messageText}</div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                      {new Date(m.sentAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="field"
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 10,
              border: "1px solid #d1d5db",
            }}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type message..."
          />
          <button className="btn btn-primary" type="button" onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}