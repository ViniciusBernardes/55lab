import React, { useMemo } from "react";

const OPEN_STATUSES = new Set([
  "received",
  "triage",
  "in_progress",
  "waiting_external",
]);

export const TicketListStats = ({ tickets, loading }) => {
  const stats = useMemo(() => {
    const open = tickets.filter((t) => OPEN_STATUSES.has(t.status)).length;
    const critical = tickets.filter((t) => t.priority === "critica").length;
    const unassigned = tickets.filter((t) => !t.assignee).length;

    return { total: tickets.length, open, critical, unassigned };
  }, [tickets]);

  const items = [
    {
      key: "total",
      label: "Total",
      value: loading ? "—" : stats.total,
      icon: "fa-inbox",
    },
    {
      key: "open",
      label: "Em aberto",
      value: loading ? "—" : stats.open,
      icon: "fa-folder-open-o",
    },
    {
      key: "critical",
      label: "Críticos",
      value: loading ? "—" : stats.critical,
      icon: "fa-exclamation-circle",
      highlight: stats.critical > 0,
    },
    {
      key: "unassigned",
      label: "Sem responsável",
      value: loading ? "—" : stats.unassigned,
      icon: "fa-user-o",
    },
  ];

  return (
    <div className="lab-helpdesk-stats">
      {items.map((item) => (
        <div
          key={item.key}
          className={`lab-helpdesk-stats__card${
            item.highlight ? " lab-helpdesk-stats__card--highlight" : ""
          }`}
        >
          <span className="lab-helpdesk-stats__icon" aria-hidden="true">
            <i className={`fa ${item.icon}`} />
          </span>
          <div>
            <span className="lab-helpdesk-stats__value">{item.value}</span>
            <span className="lab-helpdesk-stats__label">{item.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
