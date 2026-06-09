import React, { useState } from "react";
import { formatDate, formatTime } from "../../utils/editalFormat";

const FIELD_LABELS = {
  objeto: "Objeto da contratação",
  orgao_responsavel: "Órgão responsável",
  orgao_contratante: "Órgão contratante",
  tipo_licitacao: "Modalidade",
  modalidade_licitacao: "Modalidade",
  data_licitacao: "Data da licitação",
  horario_licitacao: "Horário da licitação",
  valor_estimado: "Valor estimado",
  criterio_julgamento: "Critério de julgamento",
  prazo_execucao: "Prazo de execução",
  prazo_execucao_entrega: "Prazo de execução / entrega",
  tempo_medio_construcao_objeto: "Prazo de implantação",
  forma_pagamento: "Forma de pagamento",
  forma_fornecimento: "Forma de fornecimento",
  nome_portal_leilao: "Portal do certame",
  link_portal_leilao: "Link do portal",
  recomendacao: "Recomendação",
  vale_a_pena: "Vale a pena participar",
  e_aquisicao_materiais: "Aquisição de materiais",
  principais_riscos_pontos_atencao: "Principais riscos",
  objeto_contratacao: "Objeto da contratação",
};

const formatLabel = (key, labels = FIELD_LABELS) =>
  labels[key] || key.replace(/_/g, " ");

const formatValue = (value, key) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (Array.isArray(value)) return value.length ? value.join(", ") : null;
  if (key === "data_licitacao") return formatDate(value) || String(value);
  if (key === "horario_licitacao") return formatTime(value) || String(value);
  return String(value);
};

const pickFields = (source, keys) => {
  if (!source) return null;
  const data = {};
  keys.forEach((key) => {
    const formatted = formatValue(source[key], key);
    if (formatted) data[key] = formatted;
  });
  return Object.keys(data).length ? data : null;
};

const ListBlock = ({ title, items }) => {
  if (!items?.length) return null;
  return (
    <div className="lab-analysis-block">
      <h4>{title}</h4>
      <ul className="lab-analysis-list">
        {items.map((item, i) => (
          <li key={`${title}-${i}`}>
            {typeof item === "string" ? item : JSON.stringify(item)}
          </li>
        ))}
      </ul>
    </div>
  );
};

const KeyValueGrid = ({ title, data, labels = FIELD_LABELS }) => {
  if (!data || typeof data !== "object") return null;
  const entries = Object.entries(data)
    .map(([key, value]) => [key, formatValue(value, key)])
    .filter(([, value]) => value);

  if (!entries.length) return null;

  return (
    <div className="lab-analysis-block">
      <h4>{title}</h4>
      <div className="lab-analysis-kv">
        {entries.map(([key, value]) => (
          <div key={key} className="lab-analysis-kv__row">
            <span>{formatLabel(key, labels)}</span>
            <strong>
              {key === "link_portal_leilao" && value.startsWith("http") ? (
                <a href={value} target="_blank" rel="noreferrer">
                  {value}
                </a>
              ) : (
                value
              )}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
};

const TextBlock = ({ title, text }) => {
  if (!text) return null;
  return (
    <div className="lab-analysis-block">
      <h4>{title}</h4>
      <p className="lab-analysis-resumo__text">{text}</p>
    </div>
  );
};

export const EditalAnalysisView = ({ snapshot }) => {
  const [section, setSection] = useState("resumo");
  const raw = snapshot?.raw || snapshot || {};
  const completa = raw.analise_completa || {};
  const resumoExecutivo = completa.resumo_executivo || {};

  if (!raw || Object.keys(raw).length === 0) {
    return (
      <div className="lab-app-empty">
        <i className="fa fa-file-text-o" aria-hidden="true" />
        <p>Análise ainda não disponível. Importe um PDF ou dispare a análise por IA.</p>
      </div>
    );
  }

  const resumoIdentificacao = pickFields(raw, [
    "objeto",
    "orgao_responsavel",
    "tipo_licitacao",
    "data_licitacao",
    "horario_licitacao",
    "valor_estimado",
    "e_aquisicao_materiais",
  ]);

  const resumoPrazos = pickFields(raw, [
    "criterio_julgamento",
    "prazo_execucao",
    "tempo_medio_construcao_objeto",
    "forma_pagamento",
  ]);

  const resumoPortal = pickFields(raw, ["nome_portal_leilao", "link_portal_leilao"]);

  const resumoConclusao = pickFields(
    {
      ...completa.conclusao,
      vale_a_pena: raw.vale_a_pena,
    },
    ["recomendacao", "vale_a_pena", "pontos_fortes", "pontos_fracos"],
  );

  const resumoExecutivoGrid =
    pickFields(resumoExecutivo, [
      "objeto_contratacao",
      "orgao_contratante",
      "modalidade_licitacao",
      "criterio_julgamento",
      "prazo_execucao_entrega",
      "valor_estimado",
      "forma_fornecimento",
    ]) ||
    pickFields(resumoExecutivo, ["objeto_contratacao", "orgao_contratante", "valor_estimado"]);

  const riscosResumo = Array.isArray(resumoExecutivo.principais_riscos_pontos_atencao)
    ? resumoExecutivo.principais_riscos_pontos_atencao
    : resumoExecutivo.principais_riscos_pontos_atencao
      ? [String(resumoExecutivo.principais_riscos_pontos_atencao)]
      : raw.riscos_pontos_atencao;

  return (
    <div className="lab-analysis">
      <div className="lab-edital-tabs lab-edital-tabs--analysis">
        {[
          ["resumo", "Resumo"],
          ["completa", "Análise completa"],
          ["riscos", "Riscos"],
          ["json", "JSON"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`lab-edital-tab${section === key ? " is-active" : ""}`}
            onClick={() => setSection(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {section === "resumo" ? (
        <div className="lab-analysis-sections">
          <TextBlock title="Resumo executivo" text={raw.resumo} />
          <KeyValueGrid title="Visão geral" data={resumoExecutivoGrid} />
          <KeyValueGrid title="Identificação do certame" data={resumoIdentificacao} />
          <KeyValueGrid title="Julgamento e prazos" data={resumoPrazos} />
          <KeyValueGrid title="Portal do certame" data={resumoPortal} />
          <KeyValueGrid title="Conclusão preliminar" data={resumoConclusao} />
          <ListBlock title="Documentos de habilitação" items={raw.documentos_habilitacao} />
          <ListBlock title="Riscos e pontos de atenção" items={riscosResumo} />
        </div>
      ) : null}

      {section === "completa" ? (
        <div className="lab-analysis-sections">
          <KeyValueGrid title="Resumo executivo" data={completa.resumo_executivo} />
          <KeyValueGrid title="Classificação do edital" data={completa.classificacao_edital} />
          <KeyValueGrid title="Prova de conceito / demonstração" data={completa.prova_conceito_demonstracao} />
          <KeyValueGrid title="Requisitos tecnológicos" data={completa.requisitos_tecnologicos} />
          <KeyValueGrid title="Qualificação técnica" data={completa.qualificacao_tecnica} />
          <KeyValueGrid title="Checklist de participação" data={completa.checklist_participacao} />
          <KeyValueGrid title="Conclusão" data={completa.conclusao} />
          <ListBlock title="Obrigações da contratada" items={completa.obrigacoes_contratada} />
        </div>
      ) : null}

      {section === "riscos" ? (
        <div className="lab-analysis-sections">
          <ListBlock title="Riscos (topo)" items={raw.riscos_pontos_atencao} />
          <ListBlock title="Divergências" items={raw.divergencias} />
          {completa.riscos_classificados?.length ? (
            <div className="lab-analysis-block">
              <h4>Riscos classificados</h4>
              <div className="lab-analysis-risks">
                {completa.riscos_classificados.map((risco, i) => (
                  <article key={i} className="lab-analysis-risk">
                    <span
                      className={`lab-badge lab-badge--${
                        risco.nivel === "alto"
                          ? "danger"
                          : risco.nivel === "medio"
                            ? "warning"
                            : "muted"
                      }`}
                    >
                      {risco.categoria} · {risco.nivel}
                    </span>
                    <p>{risco.descricao}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {section === "json" ? (
        <pre className="lab-analysis-json">{JSON.stringify(raw, null, 2)}</pre>
      ) : null}
    </div>
  );
};
