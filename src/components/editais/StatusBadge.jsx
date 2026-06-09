import React from "react";

const LABELS = {
  rascunho: "Rascunho",
  publicado: "Publicado",
  encerrado: "Encerrado",
  cancelado: "Cancelado",
  queued: "Na fila",
  processing: "Processando",
  extracting: "Extraindo",
  awaiting_review: "Aguardando revisão",
  completed: "Concluída",
  rejected: "Rejeitada",
  error: "Erro",
  received: "Recebido",
  triage: "Em triagem",
  in_progress: "Em andamento",
  waiting_external: "Aguardando externo",
  resolved: "Resolvido",
  closed: "Fechado",
  cancelled: "Cancelado",
  ajuda: "Ajuda",
  duvida: "Dúvida",
  bug: "Bug",
  melhoria: "Melhoria",
  correcao: "Correção",
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};

const TONES = {
  rascunho: "muted",
  publicado: "success",
  encerrado: "muted",
  cancelado: "danger",
  queued: "info",
  processing: "info",
  extracting: "info",
  awaiting_review: "warning",
  completed: "success",
  rejected: "danger",
  error: "danger",
  received: "info",
  triage: "warning",
  in_progress: "info",
  waiting_external: "warning",
  resolved: "success",
  closed: "muted",
  cancelled: "danger",
  ajuda: "info",
  duvida: "info",
  bug: "danger",
  melhoria: "success",
  correcao: "warning",
  baixa: "muted",
  media: "info",
  alta: "warning",
  critica: "danger",
};

export const StatusBadge = ({ status }) => {
  const label = LABELS[status] || status;
  const tone = TONES[status] || "muted";

  return <span className={`lab-badge lab-badge--${tone}`}>{label}</span>;
};
