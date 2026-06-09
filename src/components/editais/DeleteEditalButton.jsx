import React, { useState } from "react";
import { deleteEdital } from "../../api/licitacaoApi";
import { AppActionButton } from "../app/AppActionButton";
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

  const buttonClass =
    variant === "compact"
      ? null
      : variant === "danger"
        ? "lab-app-btn lab-app-btn--danger"
        : "lab-app-btn lab-app-btn--ghost";

  return (
    <>
      {variant === "compact" ? (
        <AppActionButton
          variant="delete"
          title={label}
          aria-label={label}
          disabled={deleting}
          onClick={() => {
            setError("");
            setOpen(true);
          }}
        >
          {label}
        </AppActionButton>
      ) : (
        <button
          type="button"
          className={buttonClass}
          onClick={() => {
            setError("");
            setOpen(true);
          }}
          disabled={deleting}
          title={label}
          aria-label={label}
        >
          {label}
        </button>
      )}

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
};
