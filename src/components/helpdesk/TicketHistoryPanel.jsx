import React from "react";
import { StatusBadge } from "../editais/StatusBadge";
import { formatDateTime } from "../../utils/ticketFormat";

export function TicketHistoryPanel({ history = [] }) {
  if (!history.length) {
    return (
      <section className="lab-app-panel">
        <div className="lab-app-empty">
          <p>Nenhuma alteração de status registrada.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="lab-app-panel lab-app-panel--flush">
      <div className="lab-app-table-wrap">
        <table className="lab-app-table lab-app-table--data">
          <thead>
            <tr>
              <th>Data</th>
              <th>De</th>
              <th>Para</th>
              <th>Alterado por</th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry) => (
              <tr key={entry.id}>
                <td>{formatDateTime(entry.created_at) || "—"}</td>
                <td>
                  {entry.old_status ? (
                    <StatusBadge status={entry.old_status} />
                  ) : (
                    <span className="lab-app-muted">—</span>
                  )}
                </td>
                <td>
                  <StatusBadge status={entry.new_status} />
                </td>
                <td>{entry.changed_by?.name || "Sistema"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
