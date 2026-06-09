import React, { useEffect, useState } from "react";
import { updateTicketStatus } from "../../api/helpdeskApi";
import {
  TICKET_STATUSES,
  ticketStatusLabel,
} from "../../utils/ticketFormat";

export function TicketStatusPanel({ ticket, onUpdated }) {
  const [status, setStatus] = useState(ticket.status);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setStatus(ticket.status);
  }, [ticket.status]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await updateTicketStatus(ticket.id, {
        status,
        message: message.trim() || undefined,
      });
      setMessage("");
      if (onUpdated) await onUpdated();
    } catch (err) {
      setError(err.message || "Não foi possível alterar o status.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="lab-app-panel">
      <div className="lab-app-panel__head">
        <div>
          <h2 className="lab-app-panel__title">Alterar status</h2>
          <p className="lab-app-panel__subtitle">
            A mudança gera histórico e notifica o sistema externo.
          </p>
        </div>
      </div>

      {error ? <div className="lab-app-alert lab-app-alert--error">{error}</div> : null}

      <form className="lab-app-form" onSubmit={handleSubmit}>
        <div className="lab-app-form__grid">
          <label className="lab-app-field">
            <span>Novo status</span>
            <select
              name="status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              {TICKET_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {ticketStatusLabel(value)}
                </option>
              ))}
            </select>
          </label>

          <label className="lab-app-field lab-app-field--full">
            <span>Mensagem para o solicitante (opcional)</span>
            <textarea
              rows="3"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ex.: Seu chamado está em atendimento pela equipe técnica."
            />
          </label>
        </div>

        <div className="lab-app-form__actions">
          <button
            type="submit"
            className="lab-app-btn lab-app-btn--primary"
            disabled={saving || status === ticket.status}
          >
            {saving ? "Salvando…" : "Atualizar status"}
          </button>
        </div>
      </form>
    </section>
  );
}
