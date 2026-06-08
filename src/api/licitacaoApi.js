const API_BASE = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.message || data?.error || `Erro ${response.status} na API`;
    throw new Error(message);
  }

  return data;
}

export function listEditais(params = {}) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.status) query.set("status", params.status);
  if (params.page) query.set("page", String(params.page));
  const qs = query.toString();

  return request(`/api/licitacao/editais${qs ? `?${qs}` : ""}`);
}

export function getEdital(id) {
  return request(`/api/licitacao/editais/${id}`);
}

export function createEdital(payload) {
  return request("/api/licitacao/editais", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function importEdital(file) {
  const form = new FormData();
  form.append("arquivo", file);

  return request("/api/licitacao/editais/importar", {
    method: "POST",
    body: form,
  });
}

export function getOpenAiCredentials() {
  return request("/api/licitacao/credenciais/openai");
}

export function updateOpenAiCredentials(payload) {
  return request("/api/licitacao/credenciais/openai", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function testOpenAiCredentials() {
  return request("/api/licitacao/credenciais/openai/testar", {
    method: "POST",
  });
}

export function updateEdital(id, payload) {
  return request(`/api/licitacao/editais/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteEdital(id) {
  return request(`/api/licitacao/editais/${id}`, { method: "DELETE" });
}

export function getEditalArquivoUrl(id) {
  return `${API_BASE}/api/licitacao/editais/${id}/arquivo`;
}

export function uploadEditalArquivo(id, file) {
  const form = new FormData();
  form.append("arquivo", file);

  return request(`/api/licitacao/editais/${id}/arquivo`, {
    method: "POST",
    body: form,
  });
}

export function getEditalAiConfig(id) {
  return request(`/api/licitacao/editais/${id}/config-ia`);
}

export function updateEditalAiConfig(id, payload) {
  return request(`/api/licitacao/editais/${id}/config-ia`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function listAnalises(editalId) {
  return request(`/api/licitacao/editais/${editalId}/analises`);
}

export function triggerAnalise(editalId) {
  return request(`/api/licitacao/editais/${editalId}/analisar`, {
    method: "POST",
  });
}

export function getAnalise(id) {
  return request(`/api/licitacao/analises/${id}`);
}

export function reviewAnalise(id, approved) {
  return request(`/api/licitacao/analises/${id}/revisar`, {
    method: "POST",
    body: JSON.stringify({ approved }),
  });
}
