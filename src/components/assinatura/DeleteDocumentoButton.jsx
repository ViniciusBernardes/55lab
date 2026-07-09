import React, { useState } from "react";
import { deleteDocumento } from "../../api/assinaturaApi";
import { AppActionButton } from "../app/AppActionButton";
import { ConfirmModal } from "../editais/ConfirmModal";

export function DeleteDocumentoButton({ documento, onDeleted }) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const nome = documento.titulo || `Documento #${documento.id}`;

  const handleConfirm = async () => {
    setDeleting(true);
    setError("");

    try {
      await deleteDocumento(documento.id);
      setOpen(false);
      if (onDeleted) {
        await onDeleted();
      }
    } catch (err) {
      setError(err.message || "Não foi possível excluir o documento.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <AppActionButton
        variant="delete"
        title="Excluir documento"
        aria-label="Excluir documento"
        disabled={deleting}
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      />

      <ConfirmModal
        open={open}
        title="Excluir documento"
        message={
          <>
            <p>
              Tem certeza que deseja excluir <strong>{nome}</strong>?
            </p>
            <p className="lab-modal__hint">
              O PDF original, o arquivo assinado e o histórico de assinaturas serão removidos
              permanentemente. Esta ação não pode ser desfeita.
            </p>
            {error ? (
              <div className="lab-app-alert lab-app-alert--error">{error}</div>
            ) : null}
          </>
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirm}
        onCancel={() => {
          if (!deleting) setOpen(false);
        }}
      />
    </>
  );
}
