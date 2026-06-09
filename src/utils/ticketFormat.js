import { formatDate, formatDateTime } from "./editalFormat";

export const TICKET_STATUSES = [
  "received",
  "triage",
  "in_progress",
  "waiting_external",
  "resolved",
  "closed",
  "cancelled",
];

export const TICKET_TYPES = ["ajuda", "duvida", "bug", "melhoria", "correcao"];

export const TICKET_PRIORITIES = ["baixa", "media", "alta", "critica"];

export const ticketStatusLabel = (status) =>
  ({
    received: "Recebido",
    triage: "Em triagem",
    in_progress: "Em andamento",
    waiting_external: "Aguardando externo",
    resolved: "Resolvido",
    closed: "Fechado",
    cancelled: "Cancelado",
  })[status] || status;

export const ticketTypeLabel = (type) =>
  ({
    ajuda: "Ajuda",
    duvida: "Dúvida",
    bug: "Bug",
    melhoria: "Melhoria",
    correcao: "Correção",
  })[type] || type;

export const ticketPriorityLabel = (priority) =>
  ({
    baixa: "Baixa",
    media: "Média",
    alta: "Alta",
    critica: "Crítica",
  })[priority] || priority;

export function formatExternalId(id) {
  if (!id) return "—";
  if (id.length <= 18) return id;
  return `${id.slice(0, 8)}…${id.slice(-6)}`;
}

export function ticketCountLabel(count) {
  if (count === 1) return "1 ticket encontrado";
  return `${count} tickets encontrados`;
}

export function requesterInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export { formatDate, formatDateTime };
