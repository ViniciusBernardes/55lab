import React, { useEffect, useState } from "react";

const EMPTY = {
  titulo: "",
  numero: "",
  orgao: "",
  modalidade: "",
  objeto: "",
  valor_estimado: "",
  data_abertura: "",
  hora_abertura: "",
  data_encerramento: "",
  status: "rascunho",
  observacoes: "",
};

export const EditalForm = ({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Salvar",
}) => {
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({ ...EMPTY, ...initial });
    setError("");
  }, [initial]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        valor_estimado: form.valor_estimado !== "" ? Number(form.valor_estimado) : null,
        data_abertura: form.data_abertura || null,
        hora_abertura: form.hora_abertura || null,
        data_encerramento: form.data_encerramento || null,
      };

      await onSubmit(payload);
    } catch (err) {
      setError(err.message || "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="lab-app-form" onSubmit={handleSubmit}>
      {error ? <div className="lab-app-alert lab-app-alert--error">{error}</div> : null}

      <div className="lab-app-form__grid">
        <label className="lab-app-field lab-app-field--full">
          <span>Título *</span>
          <input
            name="titulo"
            value={form.titulo}
            onChange={handleChange}
            required
            placeholder="Ex.: Pregão Eletrônico — Software"
          />
        </label>

        <label className="lab-app-field">
          <span>Número</span>
          <input
            name="numero"
            value={form.numero}
            onChange={handleChange}
            placeholder="012/2026"
          />
        </label>

        <label className="lab-app-field">
          <span>Status</span>
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="rascunho">Rascunho</option>
            <option value="publicado">Publicado</option>
            <option value="encerrado">Encerrado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </label>

        <label className="lab-app-field">
          <span>Órgão</span>
          <input
            name="orgao"
            value={form.orgao}
            onChange={handleChange}
            placeholder="Prefeitura Municipal"
          />
        </label>

        <label className="lab-app-field">
          <span>Modalidade</span>
          <input
            name="modalidade"
            value={form.modalidade}
            onChange={handleChange}
            placeholder="Pregão Eletrônico"
          />
        </label>

        <label className="lab-app-field">
          <span>Valor estimado (R$)</span>
          <input
            name="valor_estimado"
            type="number"
            min="0"
            step="0.01"
            value={form.valor_estimado}
            onChange={handleChange}
            placeholder="150000"
          />
        </label>

        <label className="lab-app-field">
          <span>Data de abertura</span>
          <input
            name="data_abertura"
            type="date"
            value={form.data_abertura}
            onChange={handleChange}
          />
        </label>

        <label className="lab-app-field">
          <span>Horário de abertura</span>
          <input
            name="hora_abertura"
            type="time"
            value={form.hora_abertura}
            onChange={handleChange}
          />
        </label>

        <label className="lab-app-field">
          <span>Data de encerramento</span>
          <input
            name="data_encerramento"
            type="date"
            value={form.data_encerramento}
            onChange={handleChange}
          />
        </label>

        <label className="lab-app-field lab-app-field--full">
          <span>Objeto</span>
          <textarea
            name="objeto"
            rows="4"
            value={form.objeto}
            onChange={handleChange}
            placeholder="Descrição do objeto da licitação"
          />
        </label>

        <label className="lab-app-field lab-app-field--full">
          <span>Observações</span>
          <textarea
            name="observacoes"
            rows="3"
            value={form.observacoes}
            onChange={handleChange}
            placeholder="Resumo ou notas sobre o edital"
          />
        </label>
      </div>

      <div className="lab-app-form__actions">
        {onCancel ? (
          <button
            type="button"
            className="lab-app-btn lab-app-btn--ghost"
            onClick={onCancel}
            disabled={saving}
          >
            Cancelar
          </button>
        ) : null}
        <button type="submit" className="lab-app-btn lab-app-btn--primary" disabled={saving}>
          {saving ? "Salvando…" : submitLabel}
        </button>
      </div>
    </form>
  );
};
