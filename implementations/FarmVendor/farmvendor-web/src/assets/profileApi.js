const API_BASE = import.meta.env.VITE_API_URL;

async function parseResponse(res, defaultMessage) {
  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || defaultMessage);
  }

  if (!text) return null;
  return JSON.parse(text);
}

export async function getMyProfile(token) {
  const res = await fetch(`${API_BASE}/api/profile/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(res, "Failed to load profile");
}

export async function updateMyProfile(payload, token) {
  const res = await fetch(`${API_BASE}/api/profile/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(res, "Failed to update profile");
}