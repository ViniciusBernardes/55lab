import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getOpenAiCredentials, importEdital, listEditais } from "../api/licitacaoApi";
import { AppPageHeader } from "../components/app/AppPageHeader";
import { AppActionButton } from "../components/app/AppActionButton";
import { DeleteEditalButton } from "../components/editais/DeleteEditalButton";
import { StatusBadge } from "../components/editais/StatusBadge";
import { EditalUploadPanel } from "../components/editais/EditalUploadPanel";
import {
  formatCurrency,
  formatDate,
  formatPrazo,
  truncateText,
} from "../utils/editalFormat";

export const EditaisPage = () => {
  const navigate = useNavigate();
  const [editais, setEditais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [hasCredentials, setHasCredentials] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const loadEditais = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [data, creds] = await Promise.all([
        listEditais({
          q: search || undefined,
          status: statusFilter || undefined,
          data_de: dateFrom || undefined,
          data_ate: dateTo || undefined,
        }),
        getOpenAiCredentials(),
      ]);
      setEditais(data.data || []);
      setHasCredentials(!!creds.has_api_key && creds.is_active);
    } catch (err) {
      setError(err.message || "Não foi possível carregar os editais.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    loadEditais();
  }, [loadEditais]);

  const handleImport = async (file) => {
    const result = await importEdital(file);
    navigate(`/app/editais/${result.edital.id}`);
  };

  const hasActiveFilters = Boolean(search || statusFilter || dateFrom || dateTo);

  return (
    <>
      <AppPageHeader
        title="Editais"
        description="Gestão de licitações com importação de PDF e análise assistida por IA."
        actions={
          <button
            type="button"
            className="lab-app-btn lab-app-btn--primary"
            onClick={() => setShowUpload(true)}
            disabled={!hasCredentials}
          >
            <i className="fa fa-plus" aria-hidden="true" /> Importar edital
          </button>
        }
      />

      {!hasCredentials ? (
        <div className="lab-app-alert lab-app-alert--warning">
          Configure as credenciais OpenAI antes de importar editais.{" "}
          <Link to="/app/editais/credenciais">Ir para credenciais</Link>
        </div>
      ) : null}

      <section className="lab-app-panel lab-app-panel--filters">
        <div className="lab-app-filters">
          <label className="lab-app-search lab-app-search--wide">
            <i className="fa fa-search" aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar por título, número ou órgão…"
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
              <option value="rascunho">Rascunho</option>
              <option value="publicado">Publicado</option>
              <option value="encerrado">Encerrado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </label>

          <label className="lab-app-filter">
            <span>Abertura de</span>
            <input
              className="lab-app-input"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </label>

          <label className="lab-app-filter">
            <span>Abertura até</span>
            <input
              className="lab-app-input"
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </label>

          {hasActiveFilters ? (
            <button
              type="button"
              className="lab-app-btn lab-app-btn--ghost"
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setDateFrom("");
                setDateTo("");
              }}
            >
              Limpar filtros
            </button>
          ) : null}
        </div>
      </section>

      {error ? <div className="lab-app-alert lab-app-alert--error">{error}</div> : null}

      {showUpload ? (
        <section className="lab-app-panel">
          <div className="lab-app-panel__head">
            <div>
              <h2 className="lab-app-panel__title">Importar edital</h2>
              <p className="lab-app-panel__subtitle">
                Envie o PDF para extração automática dos dados e análise completa.
              </p>
            </div>
            <button
              type="button"
              className="lab-app-btn lab-app-btn--ghost"
              onClick={() => setShowUpload(false)}
            >
              Fechar
            </button>
          </div>
          <EditalUploadPanel
            onUpload={handleImport}
            disabled={!hasCredentials}
            label="Arraste o PDF ou clique para enviar"
          />
        </section>
      ) : null}

      <section className="lab-app-panel lab-app-panel--flush">
        <div className="lab-app-panel__toolbar">
          <div>
            <strong>{loading ? "—" : editais.length}</strong>
            <span> editais encontrados</span>
          </div>
        </div>

        {loading ? (
          <div className="lab-app-loading-block">
            <i className="fa fa-spinner fa-spin" aria-hidden="true" />
            <span>Carregando editais…</span>
          </div>
        ) : editais.length === 0 ? (
          <div className="lab-app-empty lab-app-empty--large">
            <i className="fa fa-folder-open-o" aria-hidden="true" />
            <h3>Nenhum edital encontrado</h3>
            <p>
              {hasActiveFilters
                ? "Ajuste os filtros ou importe um novo edital."
                : "Importe o primeiro PDF para iniciar a gestão de licitações."}
            </p>
            {hasCredentials ? (
              <button
                type="button"
                className="lab-app-btn lab-app-btn--primary"
                onClick={() => setShowUpload(true)}
              >
                Importar edital
              </button>
            ) : null}
          </div>
        ) : (
          <div className="lab-app-table-wrap">
            <table className="lab-app-table lab-app-table--data">
              <thead>
                <tr>
                  <th>Edital</th>
                  <th>Prazo</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Análise IA</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {editais.map((edital) => (
                  <tr key={edital.id}>
                    <td className="lab-app-table__primary">
                      <Link to={`/app/editais/${edital.id}`} className="lab-edital-row__link">
                        <strong>{truncateText(edital.titulo, 88)}</strong>
                        <span>
                          {edital.numero ? `#${edital.numero}` : `ID ${edital.id}`}
                          {edital.orgao ? ` · ${truncateText(edital.orgao, 42)}` : ""}
                        </span>
                        {edital.modalidade ? (
                          <em>{edital.modalidade}</em>
                        ) : null}
                      </Link>
                    </td>
                    <td>
                      <span className="lab-edital-row__prazo">{formatPrazo(edital)}</span>
                      <span className="lab-app-muted">
                        Atualizado {formatDate(edital.updated_at) || "—"}
                      </span>
                    </td>
                    <td>{formatCurrency(edital.valor_estimado) || "—"}</td>
                    <td>
                      <StatusBadge status={edital.status} />
                    </td>
                    <td>
                      {edital.ultima_analise ? (
                        <StatusBadge status={edital.ultima_analise.status} />
                      ) : (
                        <span className="lab-app-muted">Pendente</span>
                      )}
                    </td>
                    <td className="lab-app-table__actions-cell">
                      <div className="lab-app-table__actions">
                        <AppActionButton
                          as={Link}
                          to={`/app/editais/${edital.id}`}
                          variant="view"
                          title="Abrir edital"
                          aria-label="Abrir edital"
                        >
                          Abrir
                        </AppActionButton>
                        <DeleteEditalButton
                          edital={edital}
                          onDeleted={loadEditais}
                          variant="compact"
                        />
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
