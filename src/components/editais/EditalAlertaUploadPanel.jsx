import React, { useEffect, useRef, useState } from "react";
import { getAlertaSegmentos } from "../../api/licitacaoApi";

const FALLBACK_SEGMENTOS = [
  { key: "software", label: "Software" },
  { key: "protocolo", label: "Protocolo" },
  { key: "gestao_educacional", label: "Gestão educacional" },
  { key: "cesta_de_preco", label: "Cesta de preço" },
];

const SOURCE_OPTIONS = [
  {
    key: "pdf",
    title: "PDF do alerta",
    description: "Portal de Compras Públicas ou BLL",
    accept: ".pdf,application/pdf",
    icon: "fa-file-pdf-o",
    typesLabel: "PDF · até 50 MB",
    dropLabel: "Arraste o PDF do alerta ou clique para enviar",
  },
  {
    key: "xlsx",
    title: "Planilha de oportunidades",
    description: "Excel PNCP · encerramento em hoje + 2 dias",
    accept:
      ".xlsx,.xls,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel",
    icon: "fa-file-excel-o",
    typesLabel: "XLSX · até 50 MB",
    dropLabel: "Arraste a planilha .xlsx ou clique para enviar",
  },
];

const isAllowedFile = (file, sourceKey) => {
  const name = (file?.name || "").toLowerCase();
  if (sourceKey === "xlsx") {
    return /\.(xlsx|xls|xlsm)$/.test(name);
  }
  return name.endsWith(".pdf");
};

export const EditalAlertaUploadPanel = ({
  onUpload,
  disabled = false,
}) => {
  const inputRef = useRef(null);
  const [source, setSource] = useState("pdf");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const [segmentos, setSegmentos] = useState(FALLBACK_SEGMENTOS);
  const [selected, setSelected] = useState(FALLBACK_SEGMENTOS.map((s) => s.key));

  const activeSource =
    SOURCE_OPTIONS.find((option) => option.key === source) || SOURCE_OPTIONS[0];

  useEffect(() => {
    let active = true;
    getAlertaSegmentos()
      .then((data) => {
        if (!active) return;
        const items = data.segmentos || FALLBACK_SEGMENTOS;
        setSegmentos(items);
        setSelected(data.defaults || items.map((item) => item.key));
      })
      .catch(() => {
        if (!active) return;
        setSegmentos(FALLBACK_SEGMENTOS);
      });
    return () => {
      active = false;
    };
  }, []);

  const toggleSegmento = (key) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  const handleFile = async (file) => {
    if (!file) return;
    if (selected.length === 0) {
      setError("Selecione ao menos um segmento.");
      return;
    }
    if (!isAllowedFile(file, source)) {
      setError(
        source === "xlsx"
          ? "Selecione uma planilha .xlsx de oportunidades."
          : "Selecione um PDF de alerta (PCP ou BLL).",
      );
      return;
    }

    setSelectedFile(file);
    setUploading(true);
    setError("");

    try {
      await onUpload(file, selected);
    } catch (err) {
      setError(err.message || "Falha no envio do alerta.");
    } finally {
      setUploading(false);
      setSelectedFile(null);
    }
  };

  return (
    <div className="lab-editais-upload-panel">
      <div className="lab-editais-segmentos">
        <strong>Segmentos monitorados</strong>
        <p className="lab-app-muted">
          O sistema importa apenas as oportunidades que casarem com os segmentos
          selecionados.
        </p>
        <div className="lab-editais-segmentos__list">
          {segmentos.map((segmento) => (
            <label key={segmento.key} className="lab-editais-segmentos__item">
              <input
                type="checkbox"
                checked={selected.includes(segmento.key)}
                onChange={() => toggleSegmento(segmento.key)}
                disabled={disabled || uploading}
              />
              <span>{segmento.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="lab-editais-source-toggle" role="tablist" aria-label="Tipo de alerta">
        {SOURCE_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            role="tab"
            aria-selected={source === option.key}
            className={`lab-editais-source-toggle__btn${
              source === option.key ? " is-active" : ""
            }`}
            disabled={disabled || uploading}
            onClick={() => {
              setSource(option.key);
              setError("");
              setSelectedFile(null);
            }}
          >
            <i className={`fa ${option.icon}`} aria-hidden="true" />
            <span>
              <strong>{option.title}</strong>
              <small>{option.description}</small>
            </span>
          </button>
        ))}
      </div>

      <div
        className={`lab-editais-dropzone${dragging ? " is-dragging" : ""}${
          disabled ? " is-disabled" : ""
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !uploading) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (disabled || uploading) return;
          handleFile(event.dataTransfer.files?.[0]);
        }}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
      >
        <i className={`fa ${activeSource.icon}`} aria-hidden="true" />
        <strong>
          {uploading ? "Processando alerta…" : activeSource.dropLabel}
        </strong>
        <p>
          {source === "xlsx"
            ? "Na planilha entram só licitações com data de encerramento igual a hoje + 2 dias. Os editais são baixados pelo PNCP e analisados automaticamente."
            : "Após a extração, cada edital compatível é baixado e analisado automaticamente."}
        </p>
        <span className="lab-editais-dropzone__types">{activeSource.typesLabel}</span>
        <input
          ref={inputRef}
          type="file"
          accept={activeSource.accept}
          onChange={(event) => {
            handleFile(event.target.files?.[0]);
            event.target.value = "";
          }}
          disabled={disabled || uploading}
          hidden
        />
      </div>

      {selectedFile ? (
        <div className="lab-editais-file lab-editais-file--pending">
          <i className={`fa ${activeSource.icon}`} aria-hidden="true" />
          <div>
            <strong>{selectedFile.name}</strong>
            <span>
              {uploading
                ? "Extraindo segmentos e enfileirando editais…"
                : `${Math.round(selectedFile.size / 1024)} KB`}
            </span>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="lab-app-alert lab-app-alert--error">{error}</div>
      ) : null}
    </div>
  );
};
