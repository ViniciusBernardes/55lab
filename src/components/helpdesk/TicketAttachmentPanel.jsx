import React from "react";
import { getTicketAttachmentUrl } from "../../api/helpdeskApi";
import { formatFileSize, formatMimeType } from "../../utils/editalFormat";

const FileIcon = () => (
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

export function TicketAttachmentPanel({ ticket }) {
  const hasAttachment = Boolean(ticket?.attachment_filename || ticket?.attachment_path);

  if (!hasAttachment) {
    return null;
  }

  const url = getTicketAttachmentUrl(ticket.id);
  const filename = ticket.attachment_filename || "Anexo do ticket";

  return (
    <section className="lab-app-panel">
      <div className="lab-app-panel__head">
        <div>
          <h2 className="lab-app-panel__title">Anexo do solicitante</h2>
          <p className="lab-app-panel__subtitle">
            Arquivo enviado pelo sistema externo junto com a abertura do chamado.
          </p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="lab-app-btn lab-app-btn--primary"
        >
          <i className="fa fa-external-link" aria-hidden="true" />
          Abrir anexo
        </a>
      </div>

      <div className="lab-edital-doc-preview">
        <div className="lab-edital-doc-preview__icon">
          <FileIcon />
        </div>
        <div className="lab-edital-doc-preview__body">
          <strong>{filename}</strong>
          <p>
            {formatFileSize(ticket.attachment_size) || "Tamanho não informado"}
            {ticket.attachment_mime
              ? ` · ${formatMimeType(ticket.attachment_mime)}`
              : ""}
          </p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="lab-app-btn lab-app-btn--ghost"
        >
          Visualizar
        </a>
      </div>
    </section>
  );
}
