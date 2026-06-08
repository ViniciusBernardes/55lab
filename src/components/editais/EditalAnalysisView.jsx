import React, { useState } from "react";

const ListBlock = ({ title, items }) => {
  if (!items?.length) return null;
  return (
    <div className="lab-analysis-block">
      <h4>{title}</h4>
      <ul>
        {items.map((item, i) => (
          <li key={`${title}-${i}`}>{typeof item === "string" ? item : JSON.stringify(item)}</li>
        ))}
      </ul>
    </div>
  );
};

const KeyValueGrid = ({ title, data }) => {
  if (!data || typeof data !== "object") return null;
  const entries = Object.entries(data).filter(([, v]) => v !== null && v !== "");
  if (!entries.length) return null;

  return (
    <div className="lab-analysis-block">
      <h4>{title}</h4>
      <div className="lab-analysis-kv">
        {entries.map(([key, value]) => (
          <div key={key} className="lab-analysis-kv__row">
            <span>{key.replace(/_/g, " ")}</span>
            <strong>
              {typeof value === "boolean"
                ? value
                  ? "Sim"
                  : "Não"
                : Array.isArray(value)
                  ? value.join(", ")
                  : String(value)}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
};

export const EditalAnalysisView = ({ snapshot }) => {
  const [section, setSection] = useState("resumo");
  const raw = snapshot?.raw || snapshot || {};
  const completa = raw.analise_completa || {};

  if (!raw || Object.keys(raw).length === 0) {
    return <p className="lab-editais-muted">Análise ainda não disponível.</p>;
  }

  return (
    <div className="lab-analysis">
      <div className="lab-editais-tabs">
        {[
          ["resumo", "Resumo"],
          ["completa", "Análise completa"],
          ["riscos", "Riscos"],
          ["json", "JSON"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`lab-editais-tab${section === key ? " is-active" : ""}`}
            onClick={() => setSection(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {section === "resumo" ? (
        <div className="lab-analysis-resumo">
          {raw.resumo ? <p className="lab-analysis-resumo__text">{raw.resumo}</p> : null}
          <div className="lab-analysis-cards">
            {[
              ["Objeto", raw.objeto],
              ["Órgão", raw.orgao_responsavel],
              ["Modalidade", raw.tipo_licitacao],
              ["Valor estimado", raw.valor_estimado],
              ["Data", raw.data_licitacao],
              ["Critério", raw.criterio_julgamento],
              ["Prazo", raw.prazo_execucao],
              ["Portal", raw.nome_portal_leilao || raw.link_portal_leilao],
              [
                "Recomendação",
                completa.conclusao?.recomendacao,
              ],
            ]
              .filter(([, v]) => v)
              .map(([label, value]) => (
                <article key={label} className="lab-analysis-card">
                  <span>{label}</span>
                  <strong>{value}</strong>
                </article>
              ))}
          </div>
          <ListBlock title="Documentos de habilitação" items={raw.documentos_habilitacao} />
          <ListBlock title="Riscos e pontos de atenção" items={raw.riscos_pontos_atencao} />
          {raw.link_portal_leilao ? (
            <p className="lab-analysis-link">
              <a href={raw.link_portal_leilao} target="_blank" rel="noreferrer">
                Abrir portal do certame
              </a>
            </p>
          ) : null}
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
                    <span className={`lab-badge lab-badge--${risco.nivel === "alto" ? "danger" : risco.nivel === "medio" ? "warning" : "muted"}`}>
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
        <pre className="lab-analysis-json">
          {JSON.stringify(raw, null, 2)}
        </pre>
      ) : null}
    </div>
  );
};
