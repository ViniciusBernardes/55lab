import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboard } from "../api/dashboardApi";
import { AppPageHeader } from "../components/app/AppPageHeader";
import { ModuleIllustration } from "../components/app/ModuleIllustration";
import { StatusBadge } from "../components/editais/StatusBadge";
import {
  formatPrazoRelativo,
  segmentoLabel,
  truncateText,
} from "../utils/editalFormat";

const MODULE_CARDS = [
  {
    key: "editais",
    title: "Editais",
    to: "/app/editais",
    primary: (d) => d?.editais?.total ?? d?.total_editais ?? 0,
    primaryLabel: "cadastrados",
    metrics: (d) => [
      { label: "Em aberto", value: d?.editais?.abertos ?? 0 },
      { label: "Encerram em 2 dias", value: d?.editais?.encerrando_em_2_dias ?? 0 },
      { label: "Análises pendentes", value: d?.editais?.analises_pendentes ?? 0 },
    ],
  },
  {
    key: "helpdesk",
    title: "Helpdesk",
    to: "/app/tickets",
    primary: (d) => d?.helpdesk?.abertos ?? 0,
    primaryLabel: "abertos",
    metrics: (d) => [
      { label: "Total de chamados", value: d?.helpdesk?.total_tickets ?? 0 },
    ],
  },
  {
    key: "assinatura",
    title: "Assinatura Digital",
    to: "/app/assinatura",
    primary: (d) => d?.assinatura?.pendentes ?? 0,
    primaryLabel: "pendentes",
    metrics: (d) => [
      { label: "Documentos", value: d?.assinatura?.total_documentos ?? 0 },
    ],
  },
];

const SHORTCUTS = [
  {
    label: "Importar alerta",
    to: "/app/editais",
    icon: "fa-envelope-o",
    hint: "PDF ou planilha",
  },
  {
    label: "Integrações",
    to: "/app/tickets/integracoes",
    icon: "fa-plug",
    hint: "Webhooks helpdesk",
  },
  {
    label: "OpenAI",
    to: "/app/editais/credenciais",
    icon: "fa-key",
    hint: "Credenciais de IA",
  },
];

const motivoLabel = (motivo) =>
  motivo === "analise_erro" ? "Erro na análise" : "Prazo curto";

function EditalListItem({ edital, showMotivo = false }) {
  const prazo = formatPrazoRelativo(edital);

  return (
    <Link to={`/app/editais/${edital.id}`} className="lab-app-list__item">
      <div className="lab-app-list__main">
        <strong>{truncateText(edital.titulo, 72)}</strong>
        <span>
          {edital.orgao || "Órgão não informado"}
          {edital.numero ? ` · ${edital.numero}` : ""}
          {edital.segmento ? ` · ${segmentoLabel(edital.segmento)}` : ""}
        </span>
      </div>
      <div className="lab-app-list__meta">
        {showMotivo ? (
          <span className="lab-app-chip lab-app-chip--warn">
            {motivoLabel(edital.motivo)}
          </span>
        ) : null}
        <StatusBadge status={edital.status} />
        <span className={`lab-prazo lab-prazo--${prazo.tone}`}>{prazo.label}</span>
      </div>
    </Link>
  );
}

export function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getDashboard()
      .then((response) => {
        if (active) setData(response);
      })
      .catch((err) => {
        if (active) setError(err.message || "Não foi possível carregar o painel.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <AppPageHeader
        title="Dashboard"
        description="Resumo dos módulos internos — Editais, Helpdesk e Assinatura Digital."
      />

      {error ? <div className="lab-app-alert lab-app-alert--error">{error}</div> : null}

      <div className="lab-app-module-grid">
        {MODULE_CARDS.map((mod) => (
          <Link
            key={mod.key}
            to={mod.to}
            className={`lab-app-module-card lab-app-module-card--${mod.key}${
              loading ? " is-loading" : ""
            }`}
          >
            <div className="lab-app-module-card__head">
              <span className="lab-app-module-card__art" aria-hidden="true">
                <ModuleIllustration module={mod.key} />
              </span>
              <div>
                <strong>{mod.title}</strong>
                <span>Abrir módulo</span>
              </div>
            </div>
            <div className="lab-app-module-card__value">
              <strong>{loading ? "—" : mod.primary(data)}</strong>
              <span>{mod.primaryLabel}</span>
            </div>
            <ul className="lab-app-module-card__metrics">
              {mod.metrics(data).map((metric) => (
                <li key={metric.label}>
                  <span>{metric.label}</span>
                  <strong>{loading ? "—" : metric.value}</strong>
                </li>
              ))}
            </ul>
          </Link>
        ))}
      </div>

      <div className="lab-app-shortcuts">
        {SHORTCUTS.map((item) => (
          <Link key={item.to} to={item.to} className="lab-app-shortcut">
            <i className={`fa ${item.icon}`} aria-hidden="true" />
            <span>
              <strong>{item.label}</strong>
              <small>{item.hint}</small>
            </span>
          </Link>
        ))}
      </div>

      <div className="lab-app-dashboard-cols">
        <section className="lab-app-panel">
          <div className="lab-app-panel__head">
            <div>
              <h2 className="lab-app-panel__title">Próximos editais</h2>
              <p className="lab-app-panel__subtitle">
                Ordenados pelo prazo de encerramento ou abertura
              </p>
            </div>
            <Link to="/app/editais" className="lab-app-link">
              Ver todos
            </Link>
          </div>

          {loading ? (
            <p className="lab-app-empty">Carregando…</p>
          ) : !data?.proximos_editais?.length ? (
            <div className="lab-app-empty">
              <p>Nenhum edital com prazo próximo.</p>
              <Link to="/app/editais" className="lab-app-link">
                Ir para editais
              </Link>
            </div>
          ) : (
            <div className="lab-app-list">
              {data.proximos_editais.map((edital) => (
                <EditalListItem key={edital.id} edital={edital} />
              ))}
            </div>
          )}
        </section>

        <section className="lab-app-panel">
          <div className="lab-app-panel__head">
            <div>
              <h2 className="lab-app-panel__title">Precisa de atenção</h2>
              <p className="lab-app-panel__subtitle">
                Encerramento em até 2 dias ou análise com erro
              </p>
            </div>
          </div>

          {loading ? (
            <p className="lab-app-empty">Carregando…</p>
          ) : !data?.atencao_editais?.length ? (
            <div className="lab-app-empty">
              <p>Nenhum item crítico no momento.</p>
            </div>
          ) : (
            <div className="lab-app-list">
              {data.atencao_editais.map((edital) => (
                <EditalListItem key={edital.id} edital={edital} showMotivo />
              ))}
            </div>
          )}

          {(data?.editais?.analises_erro ?? 0) > 0 ? (
            <p className="lab-app-panel__foot">
              {data.editais.analises_erro} análise(s) com erro no total
            </p>
          ) : null}
        </section>
      </div>
    </>
  );
}
