import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  listDocumentos,
  uploadDocumento,
  viewDocumentoUrl,
} from "../api/assinaturaApi";
import { ensureCsrfCookie } from "../api/httpClient";
import { AppActionButton } from "../components/app/AppActionButton";
import { AppPageHeader } from "../components/app/AppPageHeader";
import { AssinaturaUploadPanel } from "../components/assinatura/AssinaturaUploadPanel";
import { CertificadosTab } from "../components/assinatura/CertificadosTab";
import { DeleteDocumentoButton } from "../components/assinatura/DeleteDocumentoButton";

function StatusBadge({ status }) {
  const labels = {
    pendente: { text: "Pendente", tone: "warning" },
    assinado: { text: "Assinado", tone: "success" },
  };
  const info = labels[status] || { text: status, tone: "muted" };
  return <span className={`lab-badge lab-badge--${info.tone}`}>{info.text}</span>;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const AssinaturaPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "certificados" ? "certificados" : "documentos";

  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showUpload, setShowUpload] = useState(false);

  const loadDocumentos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listDocumentos({
        q: search || undefined,
        status: statusFilter || undefined,
      });
      setDocumentos(data.data || []);
    } catch (err) {
      setError(err.message || "Não foi possível carregar os documentos.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    if (activeTab === "documentos") {
      loadDocumentos();
    }
  }, [activeTab, loadDocumentos]);

  const handleUpload = async (file, titulo) => {
    const result = await uploadDocumento(file, titulo);
    navigate(`/app/assinatura/${result.id}`);
  };

  const handleView = async (doc) => {
    await ensureCsrfCookie();
    window.open(viewDocumentoUrl(doc), "_blank", "noopener,noreferrer");
  };

  const setTab = (tab) => {
    setSearchParams(tab === "certificados" ? { tab: "certificados" } : {});
  };

  return (
    <div className="lab-assinatura-module">
      <AppPageHeader
        title="Assinatura Digital"
        description="Assine documentos PDF com certificado ICP-Brasil A1, tarja lateral e página de verificação."
        actions={
          activeTab === "documentos" ? (
            <button
              type="button"
              className="lab-app-btn lab-app-btn--primary"
              onClick={() => setShowUpload(true)}
            >
              <i className="fa fa-plus" aria-hidden="true" /> Novo documento
            </button>
          ) : null
        }
      />

      <nav className="lab-edital-tabs lab-assinatura-tabs" aria-label="Seções de assinatura">
        <button
          type="button"
          className={`lab-edital-tab${activeTab === "documentos" ? " is-active" : ""}`}
          onClick={() => setTab("documentos")}
        >
          <i className="fa fa-file-pdf-o" aria-hidden="true" /> Documentos
        </button>
        <button
          type="button"
          className={`lab-edital-tab${activeTab === "certificados" ? " is-active" : ""}`}
          onClick={() => setTab("certificados")}
        >
          <i className="fa fa-id-card" aria-hidden="true" /> Meus certificados
        </button>
      </nav>

      {activeTab === "certificados" ? (
        <CertificadosTab />
      ) : (
        <>
          <div className="lab-assinatura-toolbar">
            <input
              type="search"
              className="lab-app-input"
              placeholder="Buscar por título ou código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="lab-app-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="assinado">Assinado</option>
            </select>
          </div>

          {error && <div className="lab-app-alert lab-app-alert--error">{error}</div>}

          {loading ? (
            <p className="lab-app-hint">Carregando documentos...</p>
          ) : documentos.length === 0 ? (
            <div className="lab-assinatura-empty-card">
              <i className="fa fa-file-pdf-o" aria-hidden="true" />
              <h3>Nenhum documento</h3>
              <p>Envie um PDF para iniciar o fluxo de assinatura digital ICP-Brasil.</p>
              <button
                type="button"
                className="lab-app-btn lab-app-btn--primary"
                onClick={() => setShowUpload(true)}
              >
                Enviar primeiro documento
              </button>
            </div>
          ) : (
            <div className="lab-app-table-wrap lab-assinatura-doc-table">
              <table className="lab-app-table">
                <thead>
                  <tr>
                    <th>Documento</th>
                    <th>Status</th>
                    <th>Assinaturas</th>
                    <th>Enviado em</th>
                    <th aria-label="Ações" />
                  </tr>
                </thead>
                <tbody>
                  {documentos.map((doc) => (
                    <tr key={doc.id}>
                      <td className="lab-app-table__primary">
                        <Link to={`/app/assinatura/${doc.id}`} className="lab-assinatura-doc-row__link">
                          <span className="lab-assinatura-doc-row__icon" aria-hidden="true">
                            <i className="fa fa-file-pdf-o" />
                          </span>
                          <span className="lab-assinatura-doc-row__text">
                            <strong>{doc.titulo}</strong>
                            <span>
                              <code>{doc.codigo_verificacao}</code>
                              {doc.arquivo_original_nome ? ` · ${doc.arquivo_original_nome}` : ""}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td>
                        <StatusBadge status={doc.status} />
                      </td>
                      <td>{doc.assinaturas?.length || 0}</td>
                      <td>{formatDate(doc.created_at)}</td>
                      <td className="lab-app-table__actions-cell">
                        <div className="lab-app-table__actions">
                          <AppActionButton
                            variant="view"
                            title="Visualizar PDF"
                            aria-label="Visualizar PDF"
                            onClick={() => handleView(doc)}
                          />
                          <AppActionButton
                            as={Link}
                            to={`/app/assinatura/${doc.id}`}
                            variant="open"
                            title="Abrir detalhes"
                            aria-label="Abrir detalhes"
                          />
                          <DeleteDocumentoButton documento={doc} onDeleted={loadDocumentos} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {showUpload && (
            <AssinaturaUploadPanel
              onUpload={handleUpload}
              onClose={() => setShowUpload(false)}
            />
          )}
        </>
      )}
    </div>
  );
};
