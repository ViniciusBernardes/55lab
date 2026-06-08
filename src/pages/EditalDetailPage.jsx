import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getEdital,
  listAnalises,
  triggerAnalise,
  uploadEditalArquivo,
} from "../api/licitacaoApi";
import { EditalAnalysisView } from "../components/editais/EditalAnalysisView";
import { EditalUploadPanel } from "../components/editais/EditalUploadPanel";
import { EditaisNav } from "../components/editais/EditaisNav";
import { StatusBadge } from "../components/editais/StatusBadge";

export const EditalDetailPage = () => {
  const { id } = useParams();
  const [edital, setEdital] = useState(null);
  const [analises, setAnalises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [editalData, analisesData] = await Promise.all([
        getEdital(id),
        listAnalises(id),
      ]);

      setEdital(editalData);
      setAnalises(analisesData.data || []);
    } catch (err) {
      setError(err.message || "Não foi possível carregar o edital.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const pending = analises.some((item) =>
      ["queued", "processing", "extracting"].includes(item.status),
    );

    if (!pending) return undefined;

    const timer = setInterval(loadAll, 3000);
    return () => clearInterval(timer);
  }, [analises, loadAll]);

  const ultimaAnalise = analises[0] || edital?.ultima_analise;
  const isProcessing = ["queued", "processing", "extracting"].includes(
    ultimaAnalise?.status,
  );

  const handleReupload = async (file) => {
    await uploadEditalArquivo(id, file);
    await loadAll();
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError("");
    try {
      await triggerAnalise(id);
      await loadAll();
    } catch (err) {
      setError(err.message || "Não foi possível iniciar a análise.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading && !edital) {
    return (
      <div className="lab-site lab-editais">
        <EditaisNav />
        <main className="lab-editais-main">
          <div className="lab-container">
            <p className="lab-editais-empty">Carregando edital…</p>
          </div>
        </main>
      </div>
    );
  }

  if (!edital) {
    return (
      <div className="lab-site lab-editais">
        <EditaisNav />
        <main className="lab-editais-main">
          <div className="lab-container">
            <div className="lab-editais-alert lab-editais-alert--error">
              {error || "Edital não encontrado."}
            </div>
            <Link to="/editais" className="lab-editais-back">
              <i className="fa fa-arrow-left" aria-hidden="true" /> Voltar
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="lab-site lab-editais">
      <EditaisNav />

      <main className="lab-editais-main">
        <div className="lab-container">
          <Link to="/editais" className="lab-editais-back">
            <i className="fa fa-arrow-left" aria-hidden="true" /> Todos os editais
          </Link>

          <header className="lab-editais-detail-header">
            <div>
              <span className="lab-eyebrow">Edital #{edital.id}</span>
              <h1 className="lab-heading">{edital.titulo}</h1>
              <div className="lab-editais-detail-meta">
                <StatusBadge status={edital.status} />
                {ultimaAnalise ? (
                  <StatusBadge status={ultimaAnalise.status} />
                ) : null}
                {edital.orgao ? <span>{edital.orgao}</span> : null}
                {edital.modalidade ? <span>{edital.modalidade}</span> : null}
              </div>
            </div>
            <button
              type="button"
              className="lab-btn lab-btn--primary"
              onClick={handleAnalyze}
              disabled={analyzing || isProcessing}
            >
              <i className="fa fa-magic" aria-hidden="true" />
              {isProcessing
                ? "Analisando…"
                : analyzing
                  ? "Enfileirando…"
                  : "Reanalisar com IA"}
            </button>
          </header>

          {error ? (
            <div className="lab-editais-alert lab-editais-alert--error">{error}</div>
          ) : null}

          {isProcessing ? (
            <div className="lab-editais-alert lab-editais-alert--info">
              <i className="fa fa-spinner fa-spin" aria-hidden="true" /> A IA está
              analisando o documento. Esta página atualiza automaticamente.
            </div>
          ) : null}

          <div className="lab-editais-detail-grid">
            <section className="lab-editais-panel">
              <h2 className="lab-editais-panel__title">Arquivo</h2>
              {edital.arquivo_nome_original ? (
                <div className="lab-editais-file">
                  <i className="fa fa-file-pdf-o" aria-hidden="true" />
                  <div>
                    <strong>{edital.arquivo_nome_original}</strong>
                    <span>
                      {edital.arquivo_tamanho
                        ? `${Math.round(edital.arquivo_tamanho / 1024)} KB`
                        : "Arquivo anexado"}
                    </span>
                  </div>
                </div>
              ) : null}
              <EditalUploadPanel
                onUpload={handleReupload}
                label="Substituir arquivo e reanalisar"
                hint="Envie um novo PDF — a análise será disparada automaticamente."
              />
            </section>

            <section className="lab-editais-panel lab-editais-panel--wide">
              <h2 className="lab-editais-panel__title">Resultado da análise</h2>
              {ultimaAnalise?.error_message ? (
                <div className="lab-editais-alert lab-editais-alert--error">
                  {ultimaAnalise.error_message}
                </div>
              ) : null}
              <EditalAnalysisView snapshot={ultimaAnalise?.result_snapshot} />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};
