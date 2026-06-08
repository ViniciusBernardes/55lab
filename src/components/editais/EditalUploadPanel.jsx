import React, { useRef, useState } from "react";

export const EditalUploadPanel = ({
  onUpload,
  disabled = false,
  label = "Enviar edital",
  hint = "PDF ou TXT — a IA extrai todas as informações automaticamente.",
}) => {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");

  const handleFile = async (file) => {
    if (!file) return;
    setSelectedFile(file);
    setUploading(true);
    setError("");

    try {
      await onUpload(file);
    } catch (err) {
      setError(err.message || "Falha no envio do arquivo.");
    } finally {
      setUploading(false);
      setSelectedFile(null);
    }
  };

  const onInputChange = (event) => {
    handleFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    if (disabled || uploading) return;
    handleFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div className="lab-editais-upload-panel">
      <div
        className={`lab-editais-dropzone${dragging ? " is-dragging" : ""}${
          disabled ? " is-disabled" : ""
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !uploading) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
      >
        <i className="fa fa-cloud-upload" aria-hidden="true" />
        <strong>{uploading ? "Enviando e analisando…" : label}</strong>
        <p>{hint}</p>
        <span className="lab-editais-dropzone__types">PDF · TXT · até 50 MB</span>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,application/pdf,text/plain"
          onChange={onInputChange}
          disabled={disabled || uploading}
          hidden
        />
      </div>
      {selectedFile ? (
        <div className="lab-editais-file lab-editais-file--pending">
          <i className="fa fa-file-pdf-o" aria-hidden="true" />
          <div>
            <strong>{selectedFile.name}</strong>
            <span>
              {uploading
                ? "Enviando e iniciando análise…"
                : `${Math.round(selectedFile.size / 1024)} KB`}
            </span>
          </div>
        </div>
      ) : null}
      {error ? (
        <div className="lab-editais-alert lab-editais-alert--error">{error}</div>
      ) : null}
    </div>
  );
};
