import { apiRequest } from "./httpClient";

const API_BASE = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");

export function listDocumentos(params = {}) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.status) query.set("status", params.status);
  if (params.page) query.set("page", String(params.page));
  const qs = query.toString();

  return apiRequest(`/api/assinatura/documentos${qs ? `?${qs}` : ""}`);
}

export function getDocumento(id) {
  return apiRequest(`/api/assinatura/documentos/${id}`);
}

export function uploadDocumento(file, titulo) {
  const form = new FormData();
  form.append("arquivo", file);
  form.append("titulo", titulo);

  return apiRequest("/api/assinatura/documentos", {
    method: "POST",
    body: form,
  });
}

export function assinarDocumento(id, { certificadoId, certificado, senha, papel = "Parte" } = {}) {
  const form = new FormData();
  if (certificadoId) {
    form.append("certificado_id", String(certificadoId));
    if (senha) form.append("senha", senha);
  } else if (certificado) {
    form.append("certificado", certificado);
    form.append("senha", senha);
  }
  form.append("papel", papel);

  return apiRequest(`/api/assinatura/documentos/${id}/assinar`, {
    method: "POST",
    body: form,
  });
}

export function listCertificados() {
  return apiRequest("/api/assinatura/certificados");
}

export function storeCertificado(file, senha, apelido, isPadrao = false) {
  const form = new FormData();
  form.append("certificado", file);
  form.append("senha", senha);
  form.append("apelido", apelido);
  form.append("is_padrao", isPadrao ? "1" : "0");

  return apiRequest("/api/assinatura/certificados", {
    method: "POST",
    body: form,
  });
}

export function deleteCertificado(id) {
  return apiRequest(`/api/assinatura/certificados/${id}`, {
    method: "DELETE",
  });
}

export function setCertificadoPadrao(id) {
  return apiRequest(`/api/assinatura/certificados/${id}/padrao`, {
    method: "PATCH",
  });
}

export function deleteDocumento(id) {
  return apiRequest(`/api/assinatura/documentos/${id}`, {
    method: "DELETE",
  });
}

export function getPapeis() {
  return apiRequest("/api/assinatura/papeis");
}

export function verificarDocumento(codigo) {
  return fetch(`${API_BASE}/api/assinatura/verificacao/${encodeURIComponent(codigo)}`, {
    headers: { Accept: "application/json" },
  }).then(async (response) => {
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const message = data?.message || `Erro ${response.status} na API`;
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }
    return data;
  });
}

export function downloadOriginalUrl(id) {
  return `${API_BASE}/api/assinatura/documentos/${id}/original`;
}

export function downloadAssinadoUrl(id) {
  return `${API_BASE}/api/assinatura/documentos/${id}/assinado`;
}

export function viewDocumentoUrl(documento) {
  if (documento.status === "assinado") {
    return downloadAssinadoUrl(documento.id);
  }

  return downloadOriginalUrl(documento.id);
}

export function buildVerificacaoUrl(codigo, urlFromApi) {
  if (urlFromApi) {
    return urlFromApi;
  }

  const base = (process.env.REACT_APP_SITE_URL || window.location.origin).replace(/\/$/, "");

  return `${base}/verificacao/${codigo}`;
}
