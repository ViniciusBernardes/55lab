import React from "react";
import {
  ticketPriorityLabel,
  ticketStatusLabel,
  ticketTypeLabel,
} from "../../utils/ticketFormat";

const TYPE_TONES = {
  ajuda: "info",
  duvida: "info",
  bug: "danger",
  melhoria: "success",
  correcao: "warning",
};

const PRIORITY_TONES = {
  baixa: "muted",
  media: "info",
  alta: "warning",
  critica: "danger",
};

const STATUS_TONES = {
  received: "info",
  triage: "warning",
  in_progress: "info",
  waiting_external: "warning",
  resolved: "success",
  closed: "muted",
  cancelled: "danger",
};

const TYPE_ICONS = {
  ajuda: "fa-life-ring",
  duvida: "fa-question-circle",
  bug: "fa-bug",
  melhoria: "fa-lightbulb-o",
  correcao: "fa-wrench",
};

function labelFor(kind, value) {
  if (kind === "type") return ticketTypeLabel(value);
  if (kind === "priority") return ticketPriorityLabel(value);
  return ticketStatusLabel(value);
}

function toneFor(kind, value) {
  if (kind === "type") return TYPE_TONES[value] || "muted";
  if (kind === "priority") return PRIORITY_TONES[value] || "muted";
  return STATUS_TONES[value] || "muted";
}

export const TicketBadge = ({ kind, value }) => {
  const label = labelFor(kind, value);
  const tone = toneFor(kind, value);
  const icon = kind === "type" ? TYPE_ICONS[value] : null;

  return (
    <span
      className={`lab-helpdesk-badge lab-helpdesk-badge--${kind} lab-helpdesk-badge--${tone}`}
    >
      {icon ? <i className={`fa ${icon}`} aria-hidden="true" /> : null}
      {kind === "priority" ? (
        <span className="lab-helpdesk-badge__dot" aria-hidden="true" />
      ) : null}
      {label}
    </span>
  );
};
