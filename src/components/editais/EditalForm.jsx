import React, { useState } from "react";

const EMPTY = {
  titulo: "",
  numero: "",
  orgao: "",
  modalidade: "",
  objeto: "",
  valor_estimado: "",
  data_abertura: "",
  data_encerramento: "",
  status: "rascunho",
  observacoes: "",
};

export const EditalForm = ({ initial, onSubmit, onCancel, submitLabel }) => {
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
        valor_estimado: form.valor_estimado
          ? Number(form.valor_estimado)
          : null,
        data_abertura: form.data_abertura || null,
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
    <form className="lab-editais-form" onSubmit={handleSubmit}>
      {error ? <div className="lab-editais-alert lab-editais-alert--error">{error}</div> : null}

      <div className="lab-editais-form__grid">
        <label className="lab-editais-field lab-editais-field--full">
          <span>Título *</span>
          <input
            name="titulo"
            value={form.titulo}
            onChange={handleChange}
            required
            placeholder="Ex.: Pregão Eletrônico — Software"
          />
        </label>

        <label className="lab-editais-field">
          <span>Número</span>
          <input
            name="numero"
            value={form.numero}
            onChange={handleChange}
            placeholder="012/2026"
          />
        </label>

        <label className="lab-editais-field">
          <span>Status</span>
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="rascunho">Rascunho</option>
            <option value="publicado">Publicado</option>
            <option value="encerrado">Encerrado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </label>

        <label className="lab-editais-field">
          <span>Órgão</span>
          <input
            name="orgao"
            value={form.orgao}
            onChange={handleChange}
            placeholder="Prefeitura Municipal"
          />
        </label>

        <label className="lab-editais-field">
          <span>Modalidade</span>
          <input
            name="modalidade"
            value={form.modalidade}
            onChange={handleChange}
            placeholder="Pregão Eletrônico"
          />
        </label>

        <label className="lab-editais-field">
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

        <label className="lab-editais-field">
          <span>Data de abertura</span>
          <input
            name="data_abertura"
            type="date"
            value={form.data_abertura}
            onChange={handleChange}
          />
        </label>

        <label className="lab-editais-field">
          <span>Data de encerramento</span>
          <input
            name="data_encerramento"
            type="date"
            value={form.data_encerramento}
            onChange={handleChange}
          />
        </label>

        <label className="lab-editais-field lab-editais-field--full">
          <span>Objeto</span>
          <textarea
            name="objeto"
            rows="3"
            value={form.objeto}
            onChange={handleChange}
            placeholder="Descrição do objeto da licitação"
          />
        </label>

        <label className="lab-editais-field lab-editais-field--full">
          <span>Observações</span>
          <textarea
            name="observacoes"
            rows="2"
            value={form.observacoes}
            onChange={handleChange}
          />
        </label>
      </div>

      <div className="lab-editais-form__actions">
        {onCancel ? (
          <button
            type="button"
            className="lab-btn lab-btn--ghost"
            onClick={onCancel}
            disabled={saving}
          >
            Cancelar
          </button>
        ) : null}
        <button type="submit" className="lab-btn lab-btn--primary" disabled={saving}>
          {saving ? "Salvando…" : submitLabel || "Salvar"}
        </button>
      </div>
    </form>
  );
};
