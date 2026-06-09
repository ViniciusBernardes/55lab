import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboard } from "../api/dashboardApi";
import { AppPageHeader } from "../components/app/AppPageHeader";
import { StatusBadge } from "../components/editais/StatusBadge";
import { formatDate } from "../utils/editalFormat";

const proximaData = (edital) => edital.data_encerramento || edital.data_abertura;

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
        description="Visão geral do sistema interno 55LAB."
      />

      {error ? <div className="lab-app-alert lab-app-alert--error">{error}</div> : null}

      <div className="lab-app-stats">
        <article className="lab-app-stat">
          <span className="lab-app-stat__label">Editais cadastrados</span>
          <strong className="lab-app-stat__value">
            {loading ? "—" : data?.total_editais ?? 0}
          </strong>
        </article>
      </div>

      <section className="lab-app-panel">
        <div className="lab-app-panel__head">
          <h2 className="lab-app-panel__title">Próximos editais</h2>
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
              <Link
                key={edital.id}
                to={`/app/editais/${edital.id}`}
                className="lab-app-list__item"
              >
                <div className="lab-app-list__main">
                  <strong>{edital.titulo}</strong>
                  <span>
                    {edital.orgao || "Órgão não informado"}
                    {edital.numero ? ` · ${edital.numero}` : ""}
                  </span>
                </div>
                <div className="lab-app-list__meta">
                  <StatusBadge status={edital.status} />
                  <span>{formatDate(proximaData(edital)) || "Sem data"}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
