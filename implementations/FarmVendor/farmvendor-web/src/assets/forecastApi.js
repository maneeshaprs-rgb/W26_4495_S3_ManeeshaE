const API_BASE = import.meta.env.VITE_API_URL;

async function parseResponse(res, defaultMessage) {
  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || defaultMessage);
  }

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON response from server");
  }
}

export async function generateForecasts(payload, token) {
  const res = await fetch(`${API_BASE}/api/forecasts/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(res, "Failed to generate forecast");
}

export async function getForecasts(params, token) {
  const url = new URL(`${API_BASE}/api/forecasts`);

  if (params?.forecastDate) {
    url.searchParams.append("forecastDate", params.forecastDate);
  }

  if (params?.modelName) {
    url.searchParams.append("modelName", params.modelName);
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(res, "Failed to load forecasts");
}

export async function getForecastModels(token) {
  const res = await fetch(`${API_BASE}/api/forecasts/models`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(res, "Failed to load model names");
}

export async function getForecastChartData(params, token) {
  const url = new URL(`${API_BASE}/api/forecasts/chart`);

  if (params?.vendorId) {
    url.searchParams.append("vendorId", params.vendorId);
  }

  if (params?.productId) {
    url.searchParams.append("productId", String(params.productId));
  }

  if (params?.forecastDate) {
    url.searchParams.append("forecastDate", params.forecastDate);
  }

  if (params?.modelName) {
    url.searchParams.append("modelName", params.modelName);
  }

  console.log("Calling chart API:", url.toString());

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(res, "Failed to load chart data");
}

export async function getForecastVendors(token, search = "") {
  const url = new URL(`${API_BASE}/api/forecasts/vendors`);

  if (search.trim()) {
    url.searchParams.append("search", search.trim());
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(res, "Failed to load vendors");
}

export async function getForecastProducts(token, search = "") {
  const url = new URL(`${API_BASE}/api/forecasts/products`);

  if (search.trim()) {
    url.searchParams.append("search", search.trim());
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(res, "Failed to load products");
}

export async function compareForecasts(params, token) {
  const url = new URL(`${API_BASE}/api/forecasts/compare`);

  if (params?.vendorId) {
    url.searchParams.append("vendorId", params.vendorId);
  }

  if (params?.productId) {
    url.searchParams.append("productId", String(params.productId));
  }

  if (params?.forecastDate) {
    url.searchParams.append("forecastDate", params.forecastDate);
  }

  if (params?.lookbackPeriods) {
    url.searchParams.append("lookbackPeriods", String(params.lookbackPeriods));
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(res, "Failed to compare forecasts");
}

export async function getRecommendedVendors(forecastDate, token) {
  const url = new URL(`${API_BASE}/api/farmer/recommended-vendors`);

  if (forecastDate) {
    url.searchParams.append("forecastDate", forecastDate);
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(res, "Failed to load recommended vendors");
}