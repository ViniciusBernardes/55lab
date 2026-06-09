import { apiRequest } from "./httpClient";

export function listTickets(params = {}) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.status) query.set("status", params.status);
  if (params.type) query.set("type", params.type);
  if (params.priority) query.set("priority", params.priority);
  if (params.page) query.set("page", String(params.page));
  const qs = query.toString();

  return apiRequest(`/api/helpdesk/tickets${qs ? `?${qs}` : ""}`);
}

export function getTicket(id) {
  return apiRequest(`/api/helpdesk/tickets/${id}`);
}

export function getTicketAttachmentUrl(id) {
  const base = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");
  return `${base}/api/helpdesk/tickets/${id}/attachment`;
}

export function updateTicketStatus(id, payload) {
  return apiRequest(`/api/helpdesk/tickets/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function assignTicket(id, assignedTo) {
  return apiRequest(`/api/helpdesk/tickets/${id}/assign`, {
    method: "PATCH",
    body: JSON.stringify({ assigned_to: assignedTo }),
  });
}

export function addTicketInteraction(id, payload) {
  return apiRequest(`/api/helpdesk/tickets/${id}/interactions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getTicketHistory(id) {
  return apiRequest(`/api/helpdesk/tickets/${id}/history`);
}

export function listExternalSystems() {
  return apiRequest("/api/helpdesk/external-systems");
}

export function createExternalSystem(payload) {
  return apiRequest("/api/helpdesk/external-systems", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateExternalSystem(id, payload) {
  return apiRequest(`/api/helpdesk/external-systems/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteExternalSystem(id) {
  return apiRequest(`/api/helpdesk/external-systems/${id}`, {
    method: "DELETE",
  });
}

export function testExternalSystemWebhook(id) {
  return apiRequest(`/api/helpdesk/external-systems/${id}/test`, {
    method: "POST",
  });
}
