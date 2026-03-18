const API_BASE = import.meta.env.VITE_API_URL;

export async function createConversation(payload, token) {
  const res = await fetch(`${API_BASE}/api/chat/conversation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || "Failed to create conversation");
  return JSON.parse(text);
}

export async function getMyConversations(token) {
  const res = await fetch(`${API_BASE}/api/chat/conversations`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || "Failed to load conversations");
  return JSON.parse(text);
}

export async function getConversationMessages(conversationId, token) {
  const res = await fetch(`${API_BASE}/api/chat/messages/${conversationId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || "Failed to load messages");
  return JSON.parse(text);
}

export async function getChatUsers(role, token, search = "") {
  const url = new URL(`${API_BASE}/api/chat/users`);
  url.searchParams.append("role", role);
  if (search.trim()) {
    url.searchParams.append("search", search.trim());
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || "Failed to load users");
  return JSON.parse(text);
}
