import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listTickets } from "../api/helpdeskApi";
import { AppActionButton } from "../components/app/AppActionButton";
import { AppPageHeader } from "../components/app/AppPageHeader";
import { StatusBadge } from "../components/editais/StatusBadge";
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TICKET_TYPES,
  formatDateTime,
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

      <section className="lab-app-panel lab-app-panel--flush">
        <div className="lab-app-panel__toolbar">
          <div>
            <strong>{loading ? "—" : tickets.length}</strong>
            <span> tickets encontrados</span>
          </div>
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
            <table className="lab-app-table lab-app-table--data">
              <thead>
                <tr>
                  <th>Ticket</th>
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
                  <tr key={ticket.id}>
                    <td className="lab-app-table__primary">
                      <Link to={`/app/tickets/${ticket.id}`} className="lab-edital-row__link">
                        <strong>{truncateText(ticket.title, 88)}</strong>
                        <span>
                          #{ticket.external_id} · {ticket.external_system}
                          {ticket.attachment_filename ? " · Com anexo" : ""}
                        </span>
                        {ticket.assignee ? (
                          <em>Responsável: {ticket.assignee.name}</em>
                        ) : null}
                      </Link>
                    </td>
                    <td>
                      <strong>{ticket.requester_name}</strong>
                      <span className="lab-app-muted">{ticket.requester_email}</span>
                    </td>
                    <td>
                      <StatusBadge status={ticket.type} />
                    </td>
                    <td>
                      <StatusBadge status={ticket.priority} />
                    </td>
                    <td>
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td>{formatDateTime(ticket.updated_at) || "—"}</td>
                    <td className="lab-app-table__actions-cell">
                      <div className="lab-app-table__actions">
                        <AppActionButton
                          as={Link}
                          to={`/app/tickets/${ticket.id}`}
                          variant="view"
                          title="Abrir ticket"
                          aria-label="Abrir ticket"
                        >
                          Abrir
                        </AppActionButton>
                      </div>
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
