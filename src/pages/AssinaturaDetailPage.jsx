import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  assinarDocumento,
  downloadAssinadoUrl,
  downloadOriginalUrl,
  getDocumento,
} from "../api/assinaturaApi";
import { AppPageHeader } from "../components/app/AppPageHeader";
import { AssinaturaForm } from "../components/assinatura/AssinaturaForm";
import { ensureCsrfCookie } from "../api/httpClient";

function formatBytes(bytes) {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit++;
  }
  return `${size.toFixed(1)} ${units[unit]}`;
}

export const AssinaturaDetailPage = () => {
  const { id } = useParams();
  const [documento, setDocumento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signing, setSigning] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadDocumento = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getDocumento(id);
      setDocumento(data);
    } catch (err) {
      setError(err.message || "Documento não encontrado.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDocumento();
  }, [loadDocumento]);

  const handleAssinar = async (payload) => {
    setSigning(true);
    try {
      const result = await assinarDocumento(id, payload);
      setDocumento(result);
    } finally {
      setSigning(false);
    }
  };

  const handleDownload = async (tipo) => {
    await ensureCsrfCookie();
    const url = tipo === "assinado" ? downloadAssinadoUrl(id) : downloadOriginalUrl(id);
    window.open(url, "_blank");
  };

  const copyCode = async () => {
    if (!documento?.codigo_verificacao) return;
    await navigator.clipboard.writeText(documento.codigo_verificacao);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <p className="lab-app-hint">Carregando documento...</p>;
  }

  if (error || !documento) {
    return (
      <div className="lab-app-alert lab-app-alert--error">
        {error || "Documento não encontrado."}{" "}
        <Link to="/app/assinatura">Voltar</Link>
      </div>
    );
  }

  const verificacaoUrl =
    documento.url_verificacao ||
    `${window.location.origin}/verificacao/${documento.codigo_verificacao}`;
  const isAssinado = documento.status === "assinado";

  return (
    <div className="lab-assinatura-detail">
      <Link to="/app/assinatura" className="lab-app-back">
        <i className="fa fa-arrow-left" aria-hidden="true" /> Voltar para documentos
      </Link>

      <header className="lab-assinatura-detail-hero">
        <div className="lab-assinatura-detail-hero__main">
          <div className="lab-assinatura-detail-hero__badges">
            <span className={`lab-badge lab-badge--${isAssinado ? "success" : "warning"}`}>
              {isAssinado ? "Assinado" : "Pendente de assinatura"}
            </span>
            {documento.assinaturas?.length > 0 && (
              <span className="lab-badge lab-badge--info">
                {documento.assinaturas.length} assinatura(s)
              </span>
            )}
          </div>
          <h1>{documento.titulo}</h1>
          <p className="lab-assinatura-detail-hero__file">
            <i className="fa fa-file-pdf-o" aria-hidden="true" /> {documento.arquivo_original_nome}
            <span>· {formatBytes(documento.arquivo_original_tamanho)}</span>
          </p>
        </div>
        <div className="lab-assinatura-detail-hero__code">
          <span>Código de verificação</span>
          <code>{documento.codigo_verificacao}</code>
          <button
            type="button"
            className="lab-assinatura-detail-hero__copy-btn"
            onClick={copyCode}
          >
            <i className={`fa ${copied ? "fa-check" : "fa-copy"}`} aria-hidden="true" />
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
      </header>

      <div className="lab-assinatura-detail-grid">
        <div className="lab-assinatura-detail-main">
          <section className="lab-assinatura-info-card">
            <h2>Arquivos e verificação</h2>
            <ul className="lab-assinatura-file-list">
              <li>
                <div>
                  <strong>Documento original</strong>
                  <span>PDF enviado para assinatura</span>
                </div>
                <button type="button" className="lab-app-btn lab-app-btn--ghost" onClick={() => handleDownload("original")}>
                  <i className="fa fa-download" aria-hidden="true" /> Baixar
                </button>
              </li>
              {documento.arquivo_assinado_path && (
                <li>
                  <div>
                    <strong>Documento assinado</strong>
                    <span>Com tarja lateral e página de verificação</span>
                  </div>
                  <button type="button" className="lab-app-btn lab-app-btn--primary" onClick={() => handleDownload("assinado")}>
                    <i className="fa fa-download" aria-hidden="true" /> Baixar assinado
                  </button>
                </li>
              )}
              <li>
                <div>
                  <strong>Central de verificação</strong>
                  <a href={verificacaoUrl} target="_blank" rel="noopener noreferrer" className="lab-app-link">
                    {verificacaoUrl}
                  </a>
                </div>
                <a href={verificacaoUrl} target="_blank" rel="noopener noreferrer" className="lab-app-btn lab-app-btn--ghost">
                  <i className="fa fa-external-link" aria-hidden="true" /> Abrir
                </a>
              </li>
            </ul>
          </section>

          {documento.assinaturas?.length > 0 && (
            <section className="lab-assinatura-info-card">
              <h2>Histórico de assinaturas</h2>
              <ul className="lab-assinatura-history">
                {documento.assinaturas.map((a) => (
                  <li key={a.id} className="lab-assinatura-history__item">
                    <div className="lab-assinatura-history__icon">
                      <i className="fa fa-check-circle" aria-hidden="true" />
                    </div>
                    <div>
                      <strong>{a.signatario_nome}</strong>
                      <span>CPF {a.signatario_cpf_mascarado} · {a.signatario_papel}</span>
                      <small>
                        {new Date(a.assinado_em).toLocaleString("pt-BR")}
                        {a.icp_brasil && " · ICP-Brasil"}
                      </small>
                      <p>{a.cadeia_certificadora}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="lab-assinatura-detail-aside">
          <AssinaturaForm onAssinar={handleAssinar} loading={signing} />
          <div className="lab-assinatura-info-card lab-assinatura-info-card--hint">
            <h3>
              <i className="fa fa-info-circle" aria-hidden="true" /> Como funciona
            </h3>
            <ol>
              <li>Selecione um certificado cadastrado ou envie um .pfx</li>
              <li>O PDF recebe assinatura PAdES (ICP-Brasil) embutida e tarja lateral</li>
              <li>Uma página de verificação é anexada ao documento</li>
            </ol>
            <Link to="/app/assinatura?tab=certificados" className="lab-app-link">
              Gerenciar certificados cadastrados
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
};
