import React, { useCallback, useEffect, useState } from "react";
import {
  deleteCertificado,
  listCertificados,
  setCertificadoPadrao,
  storeCertificado,
} from "../../api/assinaturaApi";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

export function CertificadosTab() {
  const [certificados, setCertificados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    apelido: "",
    senha: "",
    is_padrao: true,
    arquivo: null,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listCertificados();
      setCertificados(data.data || []);
    } catch (err) {
      setError(err.message || "Não foi possível carregar os certificados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.arquivo || !form.senha.trim() || !form.apelido.trim()) {
      setError("Preencha apelido, arquivo e senha do certificado.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await storeCertificado(form.arquivo, form.senha, form.apelido.trim(), form.is_padrao);
      setForm({ apelido: "", senha: "", is_padrao: true, arquivo: null });
      setShowForm(false);
      setMessage("Certificado cadastrado com sucesso.");
      await load();
    } catch (err) {
      setError(err.message || "Erro ao cadastrar certificado.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remover este certificado cadastrado?")) return;
    try {
      await deleteCertificado(id);
      await load();
    } catch (err) {
      setError(err.message || "Erro ao remover certificado.");
    }
  };

  const handleSetPadrao = async (id) => {
    try {
      await setCertificadoPadrao(id);
      await load();
    } catch (err) {
      setError(err.message || "Erro ao definir certificado padrão.");
    }
  };

  return (
    <div className="lab-assinatura-certificados">
      <div className="lab-assinatura-section-head">
        <div>
          <h2>Meus certificados digitais</h2>
          <p>Cadastre seu certificado A1 (.pfx) uma vez e reutilize em todas as assinaturas.</p>
        </div>
        <button
          type="button"
          className="lab-app-btn lab-app-btn--primary"
          onClick={() => setShowForm((v) => !v)}
        >
          <i className={`fa fa-${showForm ? "times" : "plus"}`} aria-hidden="true" />
          {showForm ? "Cancelar" : "Cadastrar certificado"}
        </button>
      </div>

      {message && <div className="lab-app-alert lab-app-alert--success">{message}</div>}
      {error && <div className="lab-app-alert lab-app-alert--error">{error}</div>}

      {showForm && (
        <form className="lab-assinatura-cert-form" onSubmit={handleSubmit}>
          <div className="lab-assinatura-cert-form__grid">
            <div className="lab-app-field">
              <label htmlFor="cert-apelido">Apelido</label>
              <input
                id="cert-apelido"
                type="text"
                className="lab-app-input"
                placeholder="Ex: Certificado pessoal"
                value={form.apelido}
                onChange={(e) => setForm((f) => ({ ...f, apelido: e.target.value }))}
                required
              />
            </div>
            <div className="lab-app-field">
              <label htmlFor="cert-arquivo">Arquivo .pfx / .p12</label>
              <input
                id="cert-arquivo"
                type="file"
                className="lab-app-input"
                accept=".pfx,.p12"
                onChange={(e) => setForm((f) => ({ ...f, arquivo: e.target.files?.[0] || null }))}
                required
              />
            </div>
            <div className="lab-app-field">
              <label htmlFor="cert-senha">Senha do certificado</label>
              <input
                id="cert-senha"
                type="password"
                className="lab-app-input"
                value={form.senha}
                onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
                autoComplete="off"
                required
              />
            </div>
          </div>
          <label className="lab-app-field lab-app-field--checkbox">
            <input
              type="checkbox"
              checked={form.is_padrao}
              onChange={(e) => setForm((f) => ({ ...f, is_padrao: e.target.checked }))}
            />
            <span>Definir como certificado padrão</span>
          </label>
          <p className="lab-modal__hint">
            O arquivo e a senha são armazenados de forma criptografada no servidor.
          </p>
          <button type="submit" className="lab-app-btn lab-app-btn--primary" disabled={saving}>
            {saving ? "Salvando..." : "Salvar certificado"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="lab-app-hint">Carregando certificados...</p>
      ) : certificados.length === 0 ? (
        <div className="lab-assinatura-empty-card">
          <i className="fa fa-id-card-o" aria-hidden="true" />
          <h3>Nenhum certificado cadastrado</h3>
          <p>Cadastre seu certificado ICP-Brasil A1 para assinar documentos com um clique.</p>
        </div>
      ) : (
        <div className="lab-assinatura-cert-grid">
          {certificados.map((cert) => (
            <article
              key={cert.id}
              className={`lab-assinatura-cert-card${cert.is_padrao ? " is-padrao" : ""}${!cert.is_valido ? " is-expirado" : ""}`}
            >
              <div className="lab-assinatura-cert-card__icon">
                <img
                  src={`${process.env.PUBLIC_URL || ""}/images/icp-brasil-logo.png`}
                  alt=""
                  width="36"
                  height="46"
                />
              </div>
              <div className="lab-assinatura-cert-card__body">
                <div className="lab-assinatura-cert-card__title">
                  <strong>{cert.apelido}</strong>
                  {cert.is_padrao && (
                    <span className="lab-badge lab-badge--success">Padrão</span>
                  )}
                  {!cert.is_valido && (
                    <span className="lab-badge lab-badge--danger">Expirado</span>
                  )}
                </div>
                <p className="lab-assinatura-cert-card__holder">{cert.titular_nome}</p>
                <dl className="lab-assinatura-cert-card__meta">
                  <div>
                    <dt>CPF</dt>
                    <dd>{cert.titular_cpf_mascarado || "—"}</dd>
                  </div>
                  <div>
                    <dt>Validade</dt>
                    <dd>{formatDate(cert.validade_certificado)}</dd>
                  </div>
                  <div>
                    <dt>Emissor</dt>
                    <dd>{cert.emissor_certificado || "—"}</dd>
                  </div>
                </dl>
              </div>
              <div className="lab-assinatura-cert-card__actions">
                {!cert.is_padrao && (
                  <button
                    type="button"
                    className="lab-app-btn lab-app-btn--ghost"
                    onClick={() => handleSetPadrao(cert.id)}
                  >
                    Tornar padrão
                  </button>
                )}
                <button
                  type="button"
                  className="lab-app-btn lab-app-btn--danger"
                  onClick={() => handleDelete(cert.id)}
                  title="Remover"
                >
                  <i className="fa fa-trash" aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
