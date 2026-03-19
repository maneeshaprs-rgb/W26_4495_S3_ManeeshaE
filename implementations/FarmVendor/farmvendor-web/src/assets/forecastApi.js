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
  if (!res.ok) throw new Error(text || "Failed to generate forecast");
  return JSON.parse(text);
}

export async function getForecasts(params, token) {
  const url = new URL(`${API_BASE}/api/forecasts`);

  if (params?.forecastDate) url.searchParams.append("forecastDate", params.forecastDate);
  if (params?.modelName) url.searchParams.append("modelName", params.modelName);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || "Failed to load forecasts");
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

export async function getForecastChartData(params, token) {
  const url = new URL(`${API_BASE}/api/forecastcharts`);

  if (params?.vendorId) url.searchParams.append("vendorId", params.vendorId);
  if (params?.productId) url.searchParams.append("productId", params.productId);
  if (params?.forecastDate) url.searchParams.append("forecastDate", params.forecastDate);
  if (params?.modelName) url.searchParams.append("modelName", params.modelName);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || "Failed to load chart data");
  return JSON.parse(text);
}

export async function getForecastVendors(token, search = "") {
  const url = new URL(`${API_BASE}/api/forecasts/vendors`);
  if (search.trim()) url.searchParams.append("search", search.trim());

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || "Failed to load vendors");
  return JSON.parse(text);
}

export async function getForecastProducts(token, search = "") {
  const url = new URL(`${API_BASE}/api/forecasts/products`);
  if (search.trim()) url.searchParams.append("search", search.trim());

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || "Failed to load products");
  return JSON.parse(text);
}

export async function compareForecasts(params, token) {
  const url = new URL(`${API_BASE}/api/forecasts/compare`);

  if (params?.vendorId) url.searchParams.append("vendorId", params.vendorId);
  if (params?.productId) url.searchParams.append("productId", params.productId);
  if (params?.forecastDate) url.searchParams.append("forecastDate", params.forecastDate);
  if (params?.lookbackPeriods) {
    url.searchParams.append("lookbackPeriods", params.lookbackPeriods);
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || "Failed to compare forecasts");
  return JSON.parse(text);
}