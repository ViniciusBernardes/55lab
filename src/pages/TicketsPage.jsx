import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listTickets } from "../api/helpdeskApi";
import { AppPageHeader } from "../components/app/AppPageHeader";
import { TicketBadge } from "../components/helpdesk/TicketBadge";
import { TicketListStats } from "../components/helpdesk/TicketListStats";
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TICKET_TYPES,
  formatDateTime,
  formatExternalId,
  requesterInitials,
  ticketCountLabel,
  ticketPriorityLabel,
  ticketStatusLabel,
  ticketTypeLabel,
} from "../utils/ticketFormat";

const truncateText = (text, max = 72) => {
  if (!text) return "";
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
};

export const TicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await listTickets({
        q: search || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        priority: priorityFilter || undefined,
      });
      setTickets(data.data || []);
    } catch (err) {
      setError(err.message || "Não foi possível carregar os tickets.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter, priorityFilter]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const hasActiveFilters = Boolean(
    search || statusFilter || typeFilter || priorityFilter,
  );

  return (
    <>
      <AppPageHeader
        title="Helpdesk"
        description="Chamados recebidos de sistemas externos com triagem e acompanhamento interno."
        actions={
          <Link to="/app/tickets/integracoes" className="lab-app-btn lab-app-btn--ghost">
            <i className="fa fa-plug" aria-hidden="true" /> Integrações
          </Link>
        }
      />

      <TicketListStats tickets={tickets} loading={loading} />

      <section className="lab-app-panel lab-app-panel--filters">
        <div className="lab-app-filters">
          <label className="lab-app-search lab-app-search--wide">
            <i className="fa fa-search" aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar por título, ID externo ou solicitante…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          <label className="lab-app-filter">
            <span>Status</span>
            <select
              className="lab-app-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos</option>
              {TICKET_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {ticketStatusLabel(status)}
                </option>
              ))}
            </select>
          </label>

          <label className="lab-app-filter">
            <span>Tipo</span>
            <select
              className="lab-app-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">Todos</option>
              {TICKET_TYPES.map((type) => (
                <option key={type} value={type}>
                  {ticketTypeLabel(type)}
                </option>
              ))}
            </select>
          </label>

          <label className="lab-app-filter">
            <span>Prioridade</span>
            <select
              className="lab-app-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">Todas</option>
              {TICKET_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {ticketPriorityLabel(priority)}
                </option>
              ))}
            </select>
          </label>

          {hasActiveFilters ? (
            <button
              type="button"
              className="lab-app-btn lab-app-btn--ghost"
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setTypeFilter("");
                setPriorityFilter("");
              }}
            >
              Limpar filtros
            </button>
          ) : null}
        </div>
      </section>

      {error ? <div className="lab-app-alert lab-app-alert--error">{error}</div> : null}

      <section className="lab-app-panel lab-app-panel--flush lab-helpdesk-list">
        <div className="lab-app-panel__toolbar lab-helpdesk-list__toolbar">
          <div className="lab-helpdesk-list__count">
            {loading ? "Carregando…" : ticketCountLabel(tickets.length)}
          </div>
          {!loading && tickets.length > 0 ? (
            <span className="lab-helpdesk-list__hint">
              Clique no ticket para ver detalhes e histórico
            </span>
          ) : null}
        </div>

        {loading ? (
          <div className="lab-app-loading-block">
            <i className="fa fa-spinner fa-spin" aria-hidden="true" />
            <span>Carregando tickets…</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="lab-app-empty lab-app-empty--large">
            <i className="fa fa-life-ring" aria-hidden="true" />
            <h3>Nenhum ticket encontrado</h3>
            <p>
              {hasActiveFilters
                ? "Ajuste os filtros para localizar chamados."
                : "Os tickets criados via integração externa aparecerão aqui."}
            </p>
          </div>
        ) : (
          <div className="lab-app-table-wrap">
            <table className="lab-app-table lab-app-table--data lab-helpdesk-table">
              <thead>
                <tr>
                  <th>Chamado</th>
                  <th>Solicitante</th>
                  <th>Tipo</th>
                  <th>Prioridade</th>
                  <th>Status</th>
                  <th>Atualizado</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="lab-helpdesk-table__row">
                    <td className="lab-helpdesk-table__ticket">
                      <Link
                        to={`/app/tickets/${ticket.id}`}
                        className="lab-helpdesk-ticket-link"
                      >
                        <span className="lab-helpdesk-ticket-link__title">
                          {truncateText(ticket.title, 88)}
                        </span>
                        <span className="lab-helpdesk-ticket-link__meta">
                          <span className="lab-helpdesk-ref">#{ticket.id}</span>
                          {ticket.external_system ? (
                            <span className="lab-helpdesk-system">
                              {ticket.external_system}
                            </span>
                          ) : null}
                          <span
                            className="lab-helpdesk-ext-id"
                            title={ticket.external_id}
                          >
                            {formatExternalId(ticket.external_id)}
                          </span>
                          {ticket.attachment_filename ? (
                            <span
                              className="lab-helpdesk-attachment"
                              title={ticket.attachment_filename}
                            >
                              <i className="fa fa-paperclip" aria-hidden="true" />
                              Anexo
                            </span>
                          ) : null}
                        </span>
                        {ticket.assignee ? (
                          <span className="lab-helpdesk-assignee">
                            <i className="fa fa-user" aria-hidden="true" />
                            {ticket.assignee.name}
                          </span>
                        ) : null}
                      </Link>
                    </td>
                    <td>
                      <div className="lab-helpdesk-requester">
                        <span
                          className="lab-helpdesk-requester__avatar"
                          aria-hidden="true"
                        >
                          {requesterInitials(ticket.requester_name)}
                        </span>
                        <div className="lab-helpdesk-requester__info">
                          <strong>{ticket.requester_name}</strong>
                          <span>{ticket.requester_email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <TicketBadge kind="type" value={ticket.type} />
                    </td>
                    <td>
                      <TicketBadge kind="priority" value={ticket.priority} />
                    </td>
                    <td>
                      <TicketBadge kind="status" value={ticket.status} />
                    </td>
                    <td className="lab-helpdesk-table__date">
                      <time dateTime={ticket.updated_at}>
                        {formatDateTime(ticket.updated_at) || "—"}
                      </time>
                    </td>
                    <td className="lab-app-table__actions-cell">
                      <Link
                        to={`/app/tickets/${ticket.id}`}
                        className="lab-helpdesk-open"
                        title="Abrir ticket"
                        aria-label={`Abrir ticket ${ticket.id}`}
                      >
                        <i className="fa fa-angle-right" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
};
