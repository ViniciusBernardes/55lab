import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getTicket } from "../api/helpdeskApi";
import { EditalBreadcrumb } from "../components/editais/EditalBreadcrumb";
import { TicketAttachmentPanel } from "../components/helpdesk/TicketAttachmentPanel";
import { TicketAssignPanel } from "../components/helpdesk/TicketAssignPanel";
import { TicketHistoryPanel } from "../components/helpdesk/TicketHistoryPanel";
import { TicketInteractionsPanel } from "../components/helpdesk/TicketInteractionsPanel";
import { TicketOverviewCard } from "../components/helpdesk/TicketOverviewCard";
import { TicketStatusPanel } from "../components/helpdesk/TicketStatusPanel";

export const TicketDetailPage = () => {
  const { id } = useParams();
  const tabsRef = useRef(null);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("tratativa");

  const loadTicket = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getTicket(id);
      setTicket(data);
    } catch (err) {
      setError(err.message || "Não foi possível carregar o ticket.");
      setTicket(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  if (loading && !ticket) {
    return (
      <div className="lab-app-loading-block">
        <i className="fa fa-spinner fa-spin" aria-hidden="true" />
        <span>Carregando ticket…</span>
      </div>
    );
  }

  if (!ticket) {
    return (
      <>
        <EditalBreadcrumb
          items={[
            { to: "/app/tickets", label: "Helpdesk" },
            { label: "Ticket não encontrado" },
          ]}
        />
        <div className="lab-app-alert lab-app-alert--error">
          {error || "Ticket não encontrado."}
        </div>
        <Link to="/app/tickets" className="lab-app-back">
          <i className="fa fa-arrow-left" aria-hidden="true" /> Voltar para helpdesk
        </Link>
      </>
    );
  }

  return (
    <>
      <EditalBreadcrumb
        items={[
          { to: "/app/tickets", label: "Helpdesk" },
          { label: `#${ticket.external_id}` },
        ]}
      />

      <TicketOverviewCard
        ticket={ticket}
        actions={
          <Link to="/app/tickets" className="lab-app-btn lab-app-btn--ghost">
            <i className="fa fa-arrow-left" aria-hidden="true" /> Voltar
          </Link>
        }
      />

      {error ? <div className="lab-app-alert lab-app-alert--error">{error}</div> : null}

      <TicketAttachmentPanel ticket={ticket} />

      <div className="lab-edital-tabs" ref={tabsRef}>
        {[
          ["tratativa", "Tratativa"],
          ["historico", "Histórico"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`lab-edital-tab${activeTab === key ? " is-active" : ""}`}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "tratativa" ? (
        <>
          <div className="lab-ticket-panels">
            <TicketStatusPanel ticket={ticket} onUpdated={loadTicket} />
            <TicketAssignPanel ticket={ticket} onUpdated={loadTicket} />
          </div>
          <TicketInteractionsPanel ticket={ticket} onUpdated={loadTicket} />
        </>
      ) : null}

      {activeTab === "historico" ? (
        <TicketHistoryPanel history={ticket.status_histories || []} />
      ) : null}
    </>
  );
};
