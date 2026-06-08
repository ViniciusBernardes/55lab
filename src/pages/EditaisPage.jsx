import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getOpenAiCredentials, importEdital, listEditais } from "../api/licitacaoApi";
import { DeleteEditalButton } from "../components/editais/DeleteEditalButton";
import { EditalArquivoLink } from "../components/editais/EditalArquivoLink";
import { EditalUploadPanel } from "../components/editais/EditalUploadPanel";
import { EditaisNav } from "../components/editais/EditaisNav";
import { StatusBadge } from "../components/editais/StatusBadge";

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
};

export const EditaisPage = () => {
  const navigate = useNavigate();
  const [editais, setEditais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
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
  }, [search, statusFilter]);

  useEffect(() => {
    loadEditais();
  }, [loadEditais]);

  const handleImport = async (file) => {
    const result = await importEdital(file);
    navigate(`/editais/${result.edital.id}`);
  };

  return (
    <div className="lab-site lab-editais">
      <EditaisNav />

      <main className="lab-editais-main">
        <div className="lab-container">
          <header className="lab-editais-header">
            <div>
              <span className="lab-eyebrow">Módulo de licitação</span>
              <h1 className="lab-heading">Editais</h1>
              <p className="lab-lead">
                Envie o PDF do edital e a IA extrai automaticamente objeto, órgão,
                valores, riscos, documentação e análise completa.
              </p>
            </div>
            <button
              type="button"
              className="lab-btn lab-btn--primary"
              onClick={() => setShowUpload(true)}
              disabled={!hasCredentials}
            >
              <i className="fa fa-plus" aria-hidden="true" /> Novo edital
            </button>
          </header>

          {!hasCredentials ? (
            <div className="lab-editais-alert lab-editais-alert--warning">
              Configure as credenciais OpenAI antes de importar editais.{" "}
              <Link to="/editais/credenciais">Ir para credenciais</Link>
            </div>
          ) : null}

          <div className="lab-editais-toolbar">
            <label className="lab-editais-search">
              <i className="fa fa-search" aria-hidden="true" />
              <input
                type="search"
                placeholder="Buscar por título, número ou órgão…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <select
              className="lab-editais-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos os status</option>
              <option value="rascunho">Rascunho</option>
              <option value="publicado">Publicado</option>
              <option value="encerrado">Encerrado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {error ? (
            <div className="lab-editais-alert lab-editais-alert--error">{error}</div>
          ) : null}

          {showUpload ? (
            <section className="lab-editais-panel">
              <div className="lab-editais-panel__head">
                <h2 className="lab-editais-panel__title">Importar edital</h2>
                <button
                  type="button"
                  className="lab-btn lab-btn--ghost"
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

          <section className="lab-editais-panel">
            {loading ? (
              <p className="lab-editais-empty">Carregando editais…</p>
            ) : editais.length === 0 ? (
              <div className="lab-editais-empty">
                <i className="fa fa-file-text-o" aria-hidden="true" />
                <p>Nenhum edital importado ainda.</p>
                {hasCredentials ? (
                  <button
                    type="button"
                    className="lab-btn lab-btn--ghost"
                    onClick={() => setShowUpload(true)}
                  >
                    Importar primeiro edital
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="lab-editais-table-wrap">
                <table className="lab-editais-table">
                  <thead>
                    <tr>
                      <th>Edital</th>
                      <th>Órgão</th>
                      <th>Status</th>
                      <th>Análise IA</th>
                      <th>Arquivo</th>
                      <th>Atualizado</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {editais.map((edital) => (
                      <tr key={edital.id}>
                        <td>
                          <strong>{edital.titulo}</strong>
                          {edital.modalidade ? (
                            <span className="lab-editais-table__meta">
                              {edital.modalidade}
                            </span>
                          ) : null}
                        </td>
                        <td>{edital.orgao || "—"}</td>
                        <td>
                          <StatusBadge status={edital.status} />
                        </td>
                        <td>
                          {edital.ultima_analise ? (
                            <StatusBadge status={edital.ultima_analise.status} />
                          ) : (
                            <span className="lab-editais-muted">Sem análise</span>
                          )}
                        </td>
                        <td>
                          {edital.arquivo_nome_original ? (
                            <EditalArquivoLink edital={edital} variant="inline" />
                          ) : (
                            <span className="lab-editais-muted">—</span>
                          )}
                        </td>
                        <td>{formatDate(edital.updated_at)}</td>
                        <td>
                          <div className="lab-editais-table__actions">
                            <Link
                              to={`/editais/${edital.id}`}
                              className="lab-editais-link"
                            >
                              Ver edital
                            </Link>
                            <DeleteEditalButton
                              edital={edital}
                              onDeleted={loadEditais}
                              label="Excluir"
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
        </div>
      </main>
    </div>
  );
};
