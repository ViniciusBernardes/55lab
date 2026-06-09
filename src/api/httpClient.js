const API_BASE = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");

export function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

export async function ensureCsrfCookie() {
  await fetch(`${API_BASE}/api/csrf-cookie`, { credentials: "include" });
}

export async function apiRequest(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const needsCsrf = !["GET", "HEAD", "OPTIONS"].includes(method);

  if (needsCsrf) {
    await ensureCsrfCookie();
  }

  const xsrf = getCookie("XSRF-TOKEN");
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(needsCsrf && xsrf ? { "X-XSRF-TOKEN": xsrf } : {}),
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.message || data?.error || `Erro ${response.status} na API`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
