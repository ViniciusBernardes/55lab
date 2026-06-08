import React from "react";
import { getEditalArquivoUrl } from "../../api/licitacaoApi";

const formatSize = (bytes) => {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const EditalArquivoLink = ({ edital, variant = "button" }) => {
  if (!edital?.arquivo_path && !edital?.arquivo_nome_original) {
    return null;
  }

  const url = getEditalArquivoUrl(edital.id);
  const nome = edital.arquivo_nome_original || "Arquivo do edital";
  const tamanho = formatSize(edital.arquivo_tamanho);

  if (variant === "inline") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="lab-editais-arquivo-inline"
      >
        <i className="fa fa-file-pdf-o" aria-hidden="true" />
        <span>{nome}</span>
        {tamanho ? <em>{tamanho}</em> : null}
        <i className="fa fa-external-link" aria-hidden="true" />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="lab-btn lab-btn--ghost lab-editais-arquivo-btn"
    >
      <i className="fa fa-external-link" aria-hidden="true" />
      Abrir arquivo
    </a>
  );
};
