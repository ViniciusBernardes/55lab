import React, { useState } from "react";
import { assignTicket } from "../../api/helpdeskApi";
import { useAuth } from "../../context/AuthContext";

export function TicketAssignPanel({ ticket, onUpdated }) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleAssign = async (assignedTo) => {
    setSaving(true);
    setError("");

    try {
      await assignTicket(ticket.id, assignedTo);
      if (onUpdated) await onUpdated();
    } catch (err) {
      setError(err.message || "Não foi possível atribuir o ticket.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="lab-app-panel">
      <div className="lab-app-panel__head">
        <div>
          <h2 className="lab-app-panel__title">Responsável</h2>
          <p className="lab-app-panel__subtitle">
            {ticket.assignee
              ? `Atribuído a ${ticket.assignee.name}`
              : "Nenhum responsável definido."}
          </p>
        </div>
      </div>

      {error ? <div className="lab-app-alert lab-app-alert--error">{error}</div> : null}

      <div className="lab-app-form__actions">
        <button
          type="button"
          className="lab-app-btn lab-app-btn--primary"
          disabled={saving || ticket.assigned_to === user?.id}
          onClick={() => handleAssign(user?.id ?? null)}
        >
          Atribuir a mim
        </button>
        <button
          type="button"
          className="lab-app-btn lab-app-btn--ghost"
          disabled={saving || !ticket.assigned_to}
          onClick={() => handleAssign(null)}
        >
          Remover atribuição
        </button>
      </div>
    </section>
  );
}
