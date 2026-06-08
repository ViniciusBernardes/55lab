import React, { useCallback, useEffect, useState } from "react";
import {
  getOpenAiCredentials,
  testOpenAiCredentials,
  updateOpenAiCredentials,
} from "../api/licitacaoApi";
import { EditaisNav } from "../components/editais/EditaisNav";

export const OpenAiCredentialsPage = () => {
  const [form, setForm] = useState({
    api_key: "",
    base_url: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    is_active: true,
  });
  const [meta, setMeta] = useState({ has_api_key: false, api_key_masked: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getOpenAiCredentials();
      setForm((prev) => ({
        ...prev,
        base_url: data.base_url || prev.base_url,
        model: data.model || prev.model,
        is_active: data.is_active ?? true,
        api_key: "",
      }));
      setMeta({
        has_api_key: data.has_api_key,
        api_key_masked: data.api_key_masked,
      });
    } catch (err) {
      setError(err.message || "Não foi possível carregar as credenciais.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        base_url: form.base_url,
        model: form.model,
        is_active: form.is_active,
      };
      if (form.api_key.trim()) {
        payload.api_key = form.api_key.trim();
      }

      const data = await updateOpenAiCredentials(payload);
      setMeta({
        has_api_key: data.has_api_key,
        api_key_masked: data.api_key_masked,
      });
      setForm((prev) => ({ ...prev, api_key: "" }));
      setMessage("Credenciais salvas com sucesso.");
    } catch (err) {
      setError(err.message || "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setError("");
    setMessage("");
    try {
      const result = await testOpenAiCredentials();
      setMessage(result.message || "Conexão OK.");
    } catch (err) {
      setError(err.message || "Falha no teste de conexão.");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="lab-site lab-editais">
      <EditaisNav />

      <main className="lab-editais-main">
        <div className="lab-container lab-container--narrow">
          <header className="lab-editais-header">
            <div>
              <span className="lab-eyebrow">Integração IA</span>
              <h1 className="lab-heading">Credenciais OpenAI</h1>
              <p className="lab-lead">
                Configure a API Key e o modelo usados para analisar editais e
                extrair automaticamente todas as informações do documento.
              </p>
            </div>
          </header>

          {loading ? (
            <p className="lab-editais-empty">Carregando…</p>
          ) : (
            <section className="lab-editais-panel">
              <form className="lab-editais-form" onSubmit={handleSave}>
                {error ? (
                  <div className="lab-editais-alert lab-editais-alert--error">{error}</div>
                ) : null}
                {message ? (
                  <div className="lab-editais-alert lab-editais-alert--success">{message}</div>
                ) : null}

                <div className="lab-editais-form__grid">
                  <label className="lab-editais-field lab-editais-field--full">
                    <span>API Key {meta.has_api_key ? "(configurada)" : "*"}</span>
                    <input
                      name="api_key"
                      type="password"
                      value={form.api_key}
                      onChange={handleChange}
                      placeholder={
                        meta.api_key_masked
                          ? `Atual: ${meta.api_key_masked} — deixe em branco para manter`
                          : "sk-..."
                      }
                      autoComplete="off"
                    />
                  </label>

                  <label className="lab-editais-field lab-editais-field--full">
                    <span>Base URL</span>
                    <input
                      name="base_url"
                      value={form.base_url}
                      onChange={handleChange}
                      placeholder="https://api.openai.com/v1"
                    />
                  </label>

                  <label className="lab-editais-field">
                    <span>Modelo</span>
                    <input
                      name="model"
                      value={form.model}
                      onChange={handleChange}
                      placeholder="gpt-4o-mini"
                    />
                  </label>

                  <label className="lab-editais-field lab-editais-field--checkbox">
                    <input
                      name="is_active"
                      type="checkbox"
                      checked={form.is_active}
                      onChange={handleChange}
                    />
                    <span>Credencial ativa</span>
                  </label>
                </div>

                <div className="lab-editais-form__actions">
                  <button
                    type="button"
                    className="lab-btn lab-btn--ghost"
                    onClick={handleTest}
                    disabled={testing || !meta.has_api_key}
                  >
                    {testing ? "Testando…" : "Testar conexão"}
                  </button>
                  <button
                    type="submit"
                    className="lab-btn lab-btn--primary"
                    disabled={saving}
                  >
                    {saving ? "Salvando…" : "Salvar credenciais"}
                  </button>
                </div>
              </form>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};
