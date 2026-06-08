import React, { useState } from "react";
import { deleteEdital } from "../../api/licitacaoApi";
import { ConfirmModal } from "./ConfirmModal";

export const DeleteEditalButton = ({
  edital,
  onDeleted,
  variant = "ghost",
  label = "Excluir",
}) => {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const nome = edital.titulo || `Edital #${edital.id}`;

  const handleConfirm = async () => {
    setDeleting(true);
    setError("");

    try {
      await deleteEdital(edital.id);
      setOpen(false);
      if (onDeleted) {
        await onDeleted();
      }
    } catch (err) {
      setError(err.message || "Não foi possível excluir o edital.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={`lab-btn lab-btn--${variant === "danger" ? "danger" : "ghost"} lab-editais-delete-btn`}
        onClick={() => {
          setError("");
          setOpen(true);
        }}
        disabled={deleting}
      >
        <i className="fa fa-trash-o" aria-hidden="true" />
        {label}
      </button>

      <ConfirmModal
        open={open}
        title="Excluir edital"
        message={
          <>
            <p>
              Tem certeza que deseja excluir <strong>{nome}</strong>?
            </p>
            <p className="lab-modal__hint">
              O arquivo anexado e todas as análises por IA serão removidos
              permanentemente. Esta ação não pode ser desfeita.
            </p>
            {error ? (
              <div className="lab-editais-alert lab-editais-alert--error">
                {error}
              </div>
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
};
