import React, { useEffect } from "react";
import { createPortal } from "react-dom";

export function AssinaturaUploadPanel({ onUpload, onClose }) {
  const [titulo, setTitulo] = React.useState("");
  const [file, setFile] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKeyDown = (e) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [loading, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !titulo.trim()) {
      setError("Informe o título e selecione um arquivo PDF.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onUpload(file, titulo.trim());
      onClose();
    } catch (err) {
      setError(err.message || "Erro ao enviar documento.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="lab-modal lab-modal--app" role="presentation" onClick={loading ? undefined : onClose}>
      <div
        className="lab-modal__dialog"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="lab-modal__header">
          <h2 className="lab-modal__title">Enviar documento para assinatura</h2>
        </header>

        <form onSubmit={handleSubmit} className="lab-modal__body">
          {error && <div className="lab-app-alert lab-app-alert--error">{error}</div>}

          <div className="lab-app-field">
            <label htmlFor="titulo-doc">Título do documento</label>
            <input
              id="titulo-doc"
              type="text"
              className="lab-app-input"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Contrato de prestação de serviços"
              required
            />
          </div>

          <div className="lab-app-field">
            <label htmlFor="arquivo-doc">Arquivo PDF</label>
            <input
              id="arquivo-doc"
              type="file"
              className="lab-app-input"
              accept=".pdf,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
            <p className="lab-modal__hint">Apenas arquivos PDF, até 50 MB.</p>
          </div>

          <footer className="lab-modal__footer">
            <button type="button" className="lab-app-btn lab-app-btn--ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="lab-app-btn lab-app-btn--primary" disabled={loading}>
              {loading ? "Enviando..." : "Enviar documento"}
            </button>
          </footer>
        </form>
      </div>
    </div>,
    document.body,
  );
}
