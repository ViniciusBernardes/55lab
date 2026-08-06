import { apiRequest } from "./httpClient";

export function listEditais(params = {}) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.status) query.set("status", params.status);
  if (params.segmento) query.set("segmento", params.segmento);
  if (params.data_de) query.set("data_de", params.data_de);
  if (params.data_ate) query.set("data_ate", params.data_ate);
  if (params.page) query.set("page", String(params.page));
  const qs = query.toString();

  return apiRequest(`/api/licitacao/editais${qs ? `?${qs}` : ""}`);
}

export function getEdital(id) {
  return apiRequest(`/api/licitacao/editais/${id}`);
}

export function createEdital(payload) {
  return apiRequest("/api/licitacao/editais", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function importEdital(file) {
  const form = new FormData();
  form.append("arquivo", file);

  return apiRequest("/api/licitacao/editais/importar", {
    method: "POST",
    body: form,
  });
}

export function getAlertaSegmentos() {
  return apiRequest("/api/licitacao/editais/alerta/segmentos");
}

export function importAlertaEditais(file, segmentos = []) {
  const form = new FormData();
  form.append("arquivo", file);
  segmentos.forEach((segmento) => form.append("segmentos[]", segmento));

  return apiRequest("/api/licitacao/editais/importar-alerta", {
    method: "POST",
    body: form,
  });
}

export function getAlertaImport(id) {
  return apiRequest(`/api/licitacao/editais/alerta-imports/${id}`);
}

export function getOpenAiCredentials() {
  return apiRequest("/api/licitacao/credenciais/openai");
}

export function updateOpenAiCredentials(payload) {
  return apiRequest("/api/licitacao/credenciais/openai", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function testOpenAiCredentials() {
  return apiRequest("/api/licitacao/credenciais/openai/testar", {
    method: "POST",
  });
}

export function updateEdital(id, payload) {
  return apiRequest(`/api/licitacao/editais/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function toggleEditalDestaque(id) {
  return apiRequest(`/api/licitacao/editais/${id}/destacar`, {
    method: "POST",
  });
}

export function deleteEdital(id) {
  return apiRequest(`/api/licitacao/editais/${id}`, { method: "DELETE" });
}

export function getEditalArquivoUrl(id) {
  const base = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");
  return `${base}/api/licitacao/editais/${id}/arquivo`;
}

export function uploadEditalArquivo(id, file) {
  const form = new FormData();
  form.append("arquivo", file);

  return apiRequest(`/api/licitacao/editais/${id}/arquivo`, {
    method: "POST",
    body: form,
  });
}

export function getEditalAiConfig(id) {
  return apiRequest(`/api/licitacao/editais/${id}/config-ia`);
}

export function updateEditalAiConfig(id, payload) {
  return apiRequest(`/api/licitacao/editais/${id}/config-ia`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function listAnalises(editalId) {
  return apiRequest(`/api/licitacao/editais/${editalId}/analises`);
}

export function triggerAnalise(editalId) {
  return apiRequest(`/api/licitacao/editais/${editalId}/analisar`, {
    method: "POST",
  });
}

export function getAnalise(id) {
  return apiRequest(`/api/licitacao/analises/${id}`);
}

export function reviewAnalise(id, approved) {
  return apiRequest(`/api/licitacao/analises/${id}/revisar`, {
    method: "POST",
    body: JSON.stringify({ approved }),
  });
}
