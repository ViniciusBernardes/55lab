import React, { useState } from "react";
import { addTicketInteraction } from "../../api/helpdeskApi";
import { formatDateTime } from "../../utils/ticketFormat";

export function TicketInteractionsPanel({ ticket, onUpdated }) {
  const [message, setMessage] = useState("");
  const [internalOnly, setInternalOnly] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const interactions = ticket.interactions || [];

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!message.trim()) return;

    setSaving(true);
    setError("");

    try {
      await addTicketInteraction(ticket.id, {
        message: message.trim(),
        internal_only: internalOnly,
      });
      setMessage("");
      if (onUpdated) await onUpdated();
    } catch (err) {
      setError(err.message || "Não foi possível adicionar o comentário.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="lab-app-panel">
      <div className="lab-app-panel__head">
        <div>
          <h2 className="lab-app-panel__title">Interações</h2>
          <p className="lab-app-panel__subtitle">
            Comentários internos ficam só no painel. Comentários públicos são enviados ao sistema externo.
          </p>
        </div>
      </div>

      {error ? <div className="lab-app-alert lab-app-alert--error">{error}</div> : null}

      <form className="lab-app-form lab-ticket-interaction-form" onSubmit={handleSubmit}>
        <label className="lab-app-field lab-app-field--full">
          <span>Novo comentário</span>
          <textarea
            rows="4"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Descreva a tratativa ou resposta ao solicitante…"
            required
          />
        </label>

        <label className="lab-app-checkbox">
          <input
            type="checkbox"
            checked={internalOnly}
            onChange={(event) => setInternalOnly(event.target.checked)}
          />
          <span>Apenas interno (não notificar sistema externo)</span>
        </label>

        <div className="lab-app-form__actions">
          <button
            type="submit"
            className="lab-app-btn lab-app-btn--primary"
            disabled={saving || !message.trim()}
          >
            {saving ? "Enviando…" : "Adicionar comentário"}
          </button>
        </div>
      </form>

      {interactions.length ? (
        <ul className="lab-ticket-interactions">
          {interactions.map((item) => (
            <li
              key={item.id}
              className={`lab-ticket-interaction${
                item.internal_only ? " lab-ticket-interaction--internal" : ""
              }`}
            >
              <header>
                <strong>{item.user?.name || "Sistema"}</strong>
                <span>{formatDateTime(item.created_at)}</span>
                {item.internal_only ? (
                  <em className="lab-ticket-interaction__tag">Interno</em>
                ) : (
                  <em className="lab-ticket-interaction__tag lab-ticket-interaction__tag--public">
                    Enviado ao externo
                  </em>
                )}
              </header>
              <p>{item.message}</p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="lab-app-empty">
          <p>Nenhuma interação registrada ainda.</p>
        </div>
      )}
    </section>
  );
}
