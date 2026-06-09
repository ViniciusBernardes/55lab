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

export { formatDate, formatDateTime };
