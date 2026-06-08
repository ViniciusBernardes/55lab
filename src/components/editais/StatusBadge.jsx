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
};

export const StatusBadge = ({ status }) => {
  const label = LABELS[status] || status;
  const tone = TONES[status] || "muted";

  return <span className={`lab-badge lab-badge--${tone}`}>{label}</span>;
};
