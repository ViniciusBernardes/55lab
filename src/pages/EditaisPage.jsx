import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getAlertaImport,
  getOpenAiCredentials,
  importAlertaEditais,
  importEdital,
  listEditais,
} from "../api/licitacaoApi";
import { AppPageHeader } from "../components/app/AppPageHeader";
import { DeleteEditalButton } from "../components/editais/DeleteEditalButton";
import { StatusBadge } from "../components/editais/StatusBadge";
import { EditalAlertaUploadPanel } from "../components/editais/EditalAlertaUploadPanel";
import { EditalUploadPanel } from "../components/editais/EditalUploadPanel";
import {
  formatCurrency,
  formatPrazoRelativo,
  SEGMENTO_LABELS,
  segmentoLabel,
  truncateText,
} from "../utils/editalFormat";

export const EditaisPage = () => {
  const navigate = useNavigate();
  const [editais, setEditais] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 15,
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [segmentoFilter, setSegmentoFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [hasCredentials, setHasCredentials] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadMode, setUploadMode] = useState("alerta");
  const [alertaStatus, setAlertaStatus] = useState(null);

  const loadEditais = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [data, creds] = await Promise.all([
        listEditais({
          q: search || undefined,
          status: statusFilter || undefined,
          segmento: segmentoFilter || undefined,
          data_de: dateFrom || undefined,
          data_ate: dateTo || undefined,
          page,
        }),
        getOpenAiCredentials(),
      ]);
      setEditais(data.data || []);
      setPagination({
        current_page: data.current_page || 1,
        last_page: data.last_page || 1,
        total: data.total || 0,
        per_page: data.per_page || 15,
      });
      setHasCredentials(!!creds.has_api_key && creds.is_active);
    } catch (err) {
      setError(err.message || "Não foi possível carregar os editais.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, segmentoFilter, dateFrom, dateTo, page]);

  useEffect(() => {
    loadEditais();
  }, [loadEditais]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, segmentoFilter, dateFrom, dateTo]);

  const handleImport = async (file) => {
    const result = await importEdital(file);
    navigate(`/app/editais/${result.edital.id}`);
  };

  const handleImportAlerta = async (file, segmentos) => {
    const result = await importAlertaEditais(file, segmentos);
    const importId = result.import?.id;
    if (!importId) {
      throw new Error("Importação de alerta não retornou identificador.");
    }

    setAlertaStatus({
      id: importId,
      status: result.import.status || "queued",
      message: "Alerta enfileirado. Extraindo oportunidades e baixando editais…",
    });
    setShowUpload(false);

    const started = Date.now();
    while (Date.now() - started < 180000) {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      const current = await getAlertaImport(importId);
      setAlertaStatus({
        id: importId,
        status: current.status,
        message:
          current.status === "completed"
            ? `Concluído: ${current.total_importados || 0} editais importados` +
              (current.total_erros ? `, ${current.total_erros} com erro` : "") +
              ` (${current.total_filtrados || 0} no segmento).`
            : current.status === "error"
              ? current.error_message || "Falha ao processar o alerta."
              : "Processando alerta e análises…",
        total_importados: current.total_importados,
        total_filtrados: current.total_filtrados,
        total_erros: current.total_erros,
      });

      if (current.status === "completed" || current.status === "error") {
        await loadEditais();
        break;
      }
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setSegmentoFilter("");
    setDateFrom("");
    setDateTo("");
  };

  const hasActiveFilters = Boolean(
    search || statusFilter || segmentoFilter || dateFrom || dateTo,
  );

  const fromItem =
    pagination.total === 0
      ? 0
      : (pagination.current_page - 1) * pagination.per_page + 1;
  const toItem = Math.min(
    pagination.current_page * pagination.per_page,
    pagination.total,
  );

  return (
    <>
      <AppPageHeader
        title="Editais"
        description="Monitore oportunidades por segmento, importe alertas (PDF/Excel) e acompanhe a análise por IA."
        actions={
          <>
            <button
              type="button"
              className="lab-app-btn lab-app-btn--ghost"
              onClick={() => {
                setUploadMode("edital");
                setShowUpload(true);
              }}
              disabled={!hasCredentials}
            >
              <i className="fa fa-file-pdf-o" aria-hidden="true" /> Importar edital
            </button>
            <button
              type="button"
              className="lab-app-btn lab-app-btn--primary"
              onClick={() => {
                setUploadMode("alerta");
                setShowUpload(true);
              }}
              disabled={!hasCredentials}
            >
              <i className="fa fa-envelope-o" aria-hidden="true" /> Importar alerta
            </button>
          </>
        }
      />

      {!hasCredentials ? (
        <div className="lab-app-alert lab-app-alert--warning">
          Configure as credenciais OpenAI antes de importar editais.{" "}
          <Link to="/app/editais/credenciais">Ir para credenciais</Link>
        </div>
      ) : null}

      <section className="lab-app-panel lab-app-panel--filters">
        <div className="lab-editais-filters">
          <div className="lab-editais-filters__top">
            <div>
              <h2 className="lab-editais-filters__title">Filtros</h2>
              <p className="lab-editais-filters__hint">
                Refine por texto, status, segmento ou período de abertura
              </p>
            </div>
            {hasActiveFilters ? (
              <button
                type="button"
                className="lab-app-btn lab-app-btn--ghost lab-app-btn--sm"
                onClick={clearFilters}
              >
                Limpar filtros
              </button>
            ) : null}
          </div>

          <label className="lab-app-search lab-editais-filters__search">
            <i className="fa fa-search" aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar por título, número ou órgão…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          <div className="lab-editais-filters__grid">
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
              <span>Segmento</span>
              <select
                className="lab-app-select"
                value={segmentoFilter}
                onChange={(e) => setSegmentoFilter(e.target.value)}
              >
                <option value="">Todos</option>
                {Object.entries(SEGMENTO_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <div className="lab-editais-filters__range" role="group" aria-label="Período de abertura">
              <span className="lab-editais-filters__range-label">Abertura</span>
              <div className="lab-editais-filters__range-inputs">
                <label className="lab-app-filter lab-app-filter--inline">
                  <span className="lab-app-sr-only">De</span>
                  <input
                    className="lab-app-input"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    aria-label="Abertura de"
                  />
                </label>
                <span className="lab-editais-filters__range-sep" aria-hidden="true">
                  até
                </span>
                <label className="lab-app-filter lab-app-filter--inline">
                  <span className="lab-app-sr-only">Até</span>
                  <input
                    className="lab-app-input"
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={(e) => setDateTo(e.target.value)}
                    aria-label="Abertura até"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>

      {error ? <div className="lab-app-alert lab-app-alert--error">{error}</div> : null}

      {alertaStatus ? (
        <div
          className={`lab-app-alert ${
            alertaStatus.status === "error"
              ? "lab-app-alert--error"
              : alertaStatus.status === "completed"
                ? "lab-app-alert--success"
                : "lab-app-alert--warning"
          }`}
        >
          {alertaStatus.message}
        </div>
      ) : null}

      {showUpload ? (
        <section className="lab-app-panel">
          <div className="lab-app-panel__head">
            <div>
              <h2 className="lab-app-panel__title">
                {uploadMode === "alerta" ? "Importar alerta de editais" : "Importar edital"}
              </h2>
              <p className="lab-app-panel__subtitle">
                {uploadMode === "alerta"
                  ? "Escolha PDF (PCP/BLL) ou planilha de oportunidades (.xlsx). O sistema filtra por segmento, baixa cada edital e inicia a análise."
                  : "Envie o PDF para extração automática dos dados e análise completa."}
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
          {uploadMode === "alerta" ? (
            <EditalAlertaUploadPanel
              onUpload={handleImportAlerta}
              disabled={!hasCredentials}
            />
          ) : (
            <EditalUploadPanel
              onUpload={handleImport}
              disabled={!hasCredentials}
              label="Arraste o PDF ou clique para enviar"
            />
          )}
        </section>
      ) : null}

      <section className="lab-app-panel lab-app-panel--flush">
        <div className="lab-app-panel__toolbar">
          <div>
            {loading ? (
              <span className="lab-app-muted">Carregando…</span>
            ) : (
              <>
                <strong>{pagination.total}</strong>
                <span>
                  {" "}
                  edital{pagination.total === 1 ? "" : "is"}
                  {pagination.total > 0
                    ? ` · exibindo ${fromItem}–${toItem}`
                    : ""}
                </span>
              </>
            )}
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
                ? "Nenhum resultado para os filtros atuais. Limpe os filtros ou importe um novo alerta."
                : "Comece importando um alerta (PCP, BLL ou Excel) ou um PDF individual."}
            </p>
            <div className="lab-app-empty__actions">
              {hasActiveFilters ? (
                <button
                  type="button"
                  className="lab-app-btn lab-app-btn--ghost"
                  onClick={clearFilters}
                >
                  Limpar filtros
                </button>
              ) : null}
              {hasCredentials ? (
                <button
                  type="button"
                  className="lab-app-btn lab-app-btn--primary"
                  onClick={() => {
                    setUploadMode("alerta");
                    setShowUpload(true);
                  }}
                >
                  Importar alerta
                </button>
              ) : (
                <Link to="/app/editais/credenciais" className="lab-app-btn lab-app-btn--primary">
                  Configurar OpenAI
                </Link>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="lab-app-table-wrap">
              <table className="lab-app-table lab-app-table--data lab-app-table--editais">
                <thead>
                  <tr>
                    <th>Edital</th>
                    <th>Segmento</th>
                    <th>Prazo</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Análise IA</th>
                    <th aria-label="Ações" />
                  </tr>
                </thead>
                <tbody>
                  {editais.map((edital) => {
                    const prazo = formatPrazoRelativo(edital);
                    return (
                      <tr key={edital.id}>
                        <td className="lab-app-table__primary">
                          <Link
                            to={`/app/editais/${edital.id}`}
                            className="lab-edital-row__link"
                          >
                            <strong>{truncateText(edital.titulo, 96)}</strong>
                            <span>
                              {edital.numero ? `#${edital.numero}` : `ID ${edital.id}`}
                              {edital.orgao
                                ? ` · ${truncateText(edital.orgao, 48)}`
                                : ""}
                            </span>
                            {edital.modalidade ? <em>{edital.modalidade}</em> : null}
                          </Link>
                        </td>
                        <td>
                          {edital.segmento ? (
                            <span
                              className={`lab-app-badge lab-app-badge--${edital.segmento}`}
                            >
                              {segmentoLabel(edital.segmento)}
                            </span>
                          ) : (
                            <span className="lab-app-muted">—</span>
                          )}
                        </td>
                        <td>
                          <span className={`lab-prazo lab-prazo--${prazo.tone}`}>
                            {prazo.label}
                          </span>
                          {prazo.date ? (
                            <span className="lab-app-muted">{prazo.date}</span>
                          ) : null}
                        </td>
                        <td className="lab-edital-row__valor">
                          {formatCurrency(edital.valor_estimado) || "—"}
                        </td>
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
                            <Link
                              to={`/app/editais/${edital.id}`}
                              className="lab-app-btn lab-app-btn--primary lab-app-btn--sm"
                            >
                              Abrir
                            </Link>
                            <DeleteEditalButton
                              edital={edital}
                              onDeleted={loadEditais}
                              variant="compact"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pagination.last_page > 1 ? (
              <div className="lab-app-pagination">
                <button
                  type="button"
                  className="lab-app-btn lab-app-btn--ghost lab-app-btn--sm"
                  disabled={pagination.current_page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </button>
                <span>
                  Página {pagination.current_page} de {pagination.last_page}
                </span>
                <button
                  type="button"
                  className="lab-app-btn lab-app-btn--ghost lab-app-btn--sm"
                  disabled={
                    pagination.current_page >= pagination.last_page || loading
                  }
                  onClick={() =>
                    setPage((p) => Math.min(pagination.last_page, p + 1))
                  }
                >
                  Próxima
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>
    </>
  );
};
