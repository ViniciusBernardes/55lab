import React from "react";
import { EditalArquivoLink } from "./EditalArquivoLink";
import { EditalUploadPanel } from "./EditalUploadPanel";
import {
  formatDateTime,
  formatFileSize,
  formatMimeType,
} from "../../utils/editalFormat";

const KeyValueGrid = ({ title, rows }) => {
  const entries = rows.filter(([, value]) => value);
  if (!entries.length) return null;

  return (
    <div className="lab-analysis-block">
      <h4>{title}</h4>
      <div className="lab-analysis-kv">
        {entries.map(([label, value]) => (
          <div key={label} className="lab-analysis-kv__row">
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
};

const PdfIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"
    />
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14 2v6h6M8 13h8M8 17h5"
    />
  </svg>
);

export function EditalDocumentTab({ edital, onUpload }) {
  const hasFile = Boolean(edital.arquivo_nome_original || edital.arquivo_path);

  const fileRows = [
    ["Nome do arquivo", edital.arquivo_nome_original],
    ["Tamanho", formatFileSize(edital.arquivo_tamanho)],
    ["Formato", formatMimeType(edital.arquivo_mime)],
    ["Última atualização", formatDateTime(edital.updated_at)],
    ["Importado em", formatDateTime(edital.created_at)],
  ];

  return (
    <section className="lab-app-panel">
      <div className="lab-app-panel__head">
        <div>
          <h2 className="lab-app-panel__title">Documento do edital</h2>
          <p className="lab-app-panel__subtitle">
            Visualize, baixe ou substitua o PDF utilizado na análise por IA.
          </p>
        </div>
        {hasFile ? <EditalArquivoLink edital={edital} variant="button" /> : null}
      </div>

      <div className="lab-analysis-sections">
        {hasFile ? (
          <>
            <div className="lab-analysis-block">
              <h4>Arquivo anexado</h4>
              <div className="lab-edital-doc-preview">
                <div className="lab-edital-doc-preview__icon">
                  <PdfIcon />
                </div>
                <div className="lab-edital-doc-preview__body">
                  <strong>{edital.arquivo_nome_original}</strong>
                  <p>
                    {formatFileSize(edital.arquivo_tamanho) || "Tamanho não informado"}
                    {edital.arquivo_mime
                      ? ` · ${formatMimeType(edital.arquivo_mime)}`
                      : ""}
                  </p>
                </div>
                <EditalArquivoLink edital={edital} variant="button" />
              </div>
            </div>

            <KeyValueGrid title="Informações do arquivo" rows={fileRows} />
          </>
        ) : (
          <div className="lab-app-empty lab-app-empty--large">
            <PdfIcon />
            <h3>Nenhum documento anexado</h3>
            <p>Envie o PDF do edital abaixo para iniciar a importação e a análise.</p>
          </div>
        )}

        <div className="lab-analysis-block">
          <h4>{hasFile ? "Substituir documento" : "Importar documento"}</h4>
          <p className="lab-analysis-resumo__text">
            {hasFile
              ? "O arquivo anterior será substituído e uma nova análise por IA será iniciada automaticamente."
              : "Arraste o PDF do edital ou selecione o arquivo no seu computador."}
          </p>
          <EditalUploadPanel
            onUpload={onUpload}
            label={hasFile ? "Arraste o novo PDF ou clique para enviar" : "Arraste o PDF ou clique para enviar"}
            hint="Formatos aceitos: PDF ou TXT · até 50 MB"
          />
        </div>

        {edital.observacoes ? (
          <div className="lab-analysis-block">
            <h4>Observações</h4>
            <p className="lab-analysis-resumo__text">{edital.observacoes}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
