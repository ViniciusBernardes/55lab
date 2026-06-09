import React from "react";
import { formatCurrency, formatDate, formatPrazo } from "../../utils/editalFormat";
import { StatusBadge } from "./StatusBadge";

export function EditalOverviewCard({ edital, ultimaAnalise, actions }) {
  const infoItems = [
    { label: "Número", value: edital.numero },
    { label: "Órgão", value: edital.orgao },
    { label: "Modalidade", value: edital.modalidade },
    { label: "Prazo", value: formatPrazo(edital) },
    { label: "Valor estimado", value: formatCurrency(edital.valor_estimado) },
    { label: "Cadastro", value: formatDate(edital.created_at) },
  ].filter((item) => item.value);

  return (
    <article className="lab-edital-hero">
      <div className="lab-edital-hero__content">
        <div className="lab-edital-hero__badges">
          <StatusBadge status={edital.status} />
          {ultimaAnalise ? <StatusBadge status={ultimaAnalise.status} /> : null}
        </div>
        <h1 className="lab-edital-hero__title">{edital.titulo}</h1>
        {edital.objeto ? (
          <p className="lab-edital-hero__object">{edital.objeto}</p>
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
