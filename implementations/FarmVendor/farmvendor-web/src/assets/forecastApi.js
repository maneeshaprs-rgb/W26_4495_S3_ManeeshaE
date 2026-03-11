const API_BASE = import.meta.env.VITE_API_URL;

export async function generateForecasts(payload, token) {
  const res = await fetch(`${API_BASE}/api/forecasts/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || "Failed to generate forecasts");
  return JSON.parse(text);
}

export async function getForecasts({ forecastDate, modelName }, token) {
  const params = new URLSearchParams();

  if (forecastDate) params.append("forecastDate", forecastDate);
  if (modelName) params.append("modelName", modelName);

  const res = await fetch(`${API_BASE}/api/forecasts?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || "Failed to load forecasts");
  return JSON.parse(text);
}

export async function compareForecasts({ vendorId, productId, forecastDate, lookbackPeriods }, token) {
  const params = new URLSearchParams({
    vendorId,
    productId: String(productId),
    forecastDate,
    lookbackPeriods: String(lookbackPeriods ?? 3),
  });

  const res = await fetch(`${API_BASE}/api/forecasts/compare?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || "Failed to compare forecasts");
  return JSON.parse(text);
}

export async function getForecastModels(token) {
  const res = await fetch(`${API_BASE}/api/forecasts/models`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || "Failed to load model names");
  return JSON.parse(text);
}