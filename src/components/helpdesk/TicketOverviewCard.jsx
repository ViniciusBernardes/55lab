import React from "react";
import { StatusBadge } from "../editais/StatusBadge";
import { formatDateTime } from "../../utils/ticketFormat";

export function TicketOverviewCard({ ticket, actions }) {
  const infoItems = [
    { label: "ID externo", value: ticket.external_id },
    { label: "Sistema", value: ticket.external_system },
    { label: "Solicitante", value: ticket.requester_name },
    { label: "E-mail", value: ticket.requester_email },
    { label: "Responsável", value: ticket.assignee?.name },
    { label: "Aberto em", value: formatDateTime(ticket.created_at) },
    { label: "Atualizado", value: formatDateTime(ticket.updated_at) },
    { label: "Fechado em", value: formatDateTime(ticket.closed_at) },
  ].filter((item) => item.value);

  return (
    <article className="lab-edital-hero">
      <div className="lab-edital-hero__content">
        <div className="lab-edital-hero__badges">
          <StatusBadge status={ticket.status} />
          <StatusBadge status={ticket.type} />
          <StatusBadge status={ticket.priority} />
        </div>
        <h1 className="lab-edital-hero__title">{ticket.title}</h1>
        {ticket.description ? (
          <p className="lab-edital-hero__object">{ticket.description}</p>
        ) : null}
        {infoItems.length ? (
          <dl className="lab-edital-hero__grid">
            {infoItems.map((item) => (
              <div key={item.label} className="lab-edital-hero__item">
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
      {actions ? <div className="lab-edital-hero__actions">{actions}</div> : null}
    </article>
  );
}
