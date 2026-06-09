import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  getEdital,
  listAnalises,
  triggerAnalise,
  uploadEditalArquivo,
} from "../api/licitacaoApi";
import { DeleteEditalButton } from "../components/editais/DeleteEditalButton";
import { EditalArquivoLink } from "../components/editais/EditalArquivoLink";
import { EditalAnalysisView } from "../components/editais/EditalAnalysisView";
import { EditalBreadcrumb } from "../components/editais/EditalBreadcrumb";
import { EditalDocumentTab } from "../components/editais/EditalDocumentTab";
import { EditalEditTab } from "../components/editais/EditalEditTab";
import { EditalOverviewCard } from "../components/editais/EditalOverviewCard";
import { truncateText } from "../utils/editalFormat";

export const EditalDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabsRef = useRef(null);
  const [edital, setEdital] = useState(null);
  const [analises, setAnalises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get("tab");
    return tab === "dados" || tab === "documento" ? tab : "analise";
  });

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

  const goToEditTab = () => {
    setActiveTab("dados");
    tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading && !edital) {
    return (
      <div className="lab-app-loading-block">
        <i className="fa fa-spinner fa-spin" aria-hidden="true" />
        <span>Carregando edital…</span>
      </div>
    );
  }

  if (!edital) {
    return (
      <>
        <EditalBreadcrumb
          items={[
            { to: "/app/editais", label: "Editais" },
            { label: "Edital não encontrado" },
          ]}
        />
        <div className="lab-app-alert lab-app-alert--error">
          {error || "Edital não encontrado."}
        </div>
        <Link to="/app/editais" className="lab-app-back">
          <i className="fa fa-arrow-left" aria-hidden="true" /> Voltar para editais
        </Link>
      </>
    );
  }

  return (
    <>
      <EditalBreadcrumb
        items={[
          { to: "/app/editais", label: "Editais" },
          { label: truncateText(edital.titulo, 56) },
        ]}
      />

      <EditalOverviewCard
        edital={edital}
        ultimaAnalise={ultimaAnalise}
        actions={
          <>
            <button
              type="button"
              className="lab-app-btn lab-app-btn--ghost"
              onClick={goToEditTab}
            >
              Editar
            </button>
            {edital.arquivo_nome_original ? (
              <EditalArquivoLink edital={edital} variant="button" />
            ) : null}
            <button
              type="button"
              className="lab-app-btn lab-app-btn--primary"
              onClick={handleAnalyze}
              disabled={analyzing || isProcessing || !edital.arquivo_path}
            >
              <i className="fa fa-magic" aria-hidden="true" />
              {isProcessing
                ? "Analisando…"
                : analyzing
                  ? "Enfileirando…"
                  : "Reanalisar com IA"}
            </button>
            <DeleteEditalButton
              edital={edital}
              variant="danger"
              label="Excluir"
              onDeleted={() => navigate("/app/editais")}
            />
          </>
        }
      />

      {error ? <div className="lab-app-alert lab-app-alert--error">{error}</div> : null}

      {isProcessing ? (
        <div className="lab-app-alert lab-app-alert--info">
          <i className="fa fa-spinner fa-spin" aria-hidden="true" /> A IA está
          analisando o documento. Esta página atualiza automaticamente.
        </div>
      ) : null}

      <div className="lab-edital-tabs" ref={tabsRef}>
        {[
          ["analise", "Análise IA"],
          ["dados", "Dados"],
          ["documento", "Documento"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`lab-edital-tab${activeTab === key ? " is-active" : ""}`}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "analise" ? (
        <section className="lab-app-panel">
          <div className="lab-app-panel__head">
            <div>
              <h2 className="lab-app-panel__title">Resultado da análise</h2>
              <p className="lab-app-panel__subtitle">
                Resumo executivo, riscos e checklist extraídos automaticamente do edital.
              </p>
            </div>
          </div>
          {ultimaAnalise?.error_message ? (
            <div className="lab-app-alert lab-app-alert--error">
              {ultimaAnalise.error_message}
            </div>
          ) : null}
          <EditalAnalysisView snapshot={ultimaAnalise?.result_snapshot} />
        </section>
      ) : null}

      {activeTab === "dados" ? (
        <EditalEditTab
          edital={edital}
          analysisSnapshot={ultimaAnalise?.result_snapshot}
          onSaved={loadAll}
        />
      ) : null}

      {activeTab === "documento" ? (
        <EditalDocumentTab edital={edital} onUpload={handleReupload} />
      ) : null}
    </>
  );
};
