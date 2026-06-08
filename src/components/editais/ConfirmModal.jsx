import React, { useEffect } from "react";

export const ConfirmModal = ({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape" && !loading) {
        onCancel();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="lab-modal"
      role="presentation"
      onClick={loading ? undefined : onCancel}
    >
      <div
        className="lab-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lab-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="lab-modal__header">
          <h2 id="lab-modal-title" className="lab-modal__title">
            {title}
          </h2>
        </header>

        <div className="lab-modal__body">
          {typeof message === "string" ? <p>{message}</p> : message}
        </div>

        <footer className="lab-modal__footer">
          <button
            type="button"
            className="lab-btn lab-btn--ghost"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`lab-btn lab-btn--${variant === "danger" ? "danger" : "primary"}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processando…" : confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  );
};
