import React, { useCallback, useEffect, useState } from "react";
import {
  getOpenAiCredentials,
  testOpenAiCredentials,
  updateOpenAiCredentials,
} from "../api/licitacaoApi";
import { AppPageHeader } from "../components/app/AppPageHeader";

export const OpenAiCredentialsPage = () => {
  const [form, setForm] = useState({
    api_key: "",
    base_url: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    is_active: true,
  });
  const [meta, setMeta] = useState({
    has_api_key: false,
    api_key_masked: null,
    api_key_decrypt_failed: false,
    api_key_source: null,
  });
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
        api_key_decrypt_failed: Boolean(data.api_key_decrypt_failed),
        api_key_source: data.api_key_source || null,
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
        api_key_decrypt_failed: Boolean(data.api_key_decrypt_failed),
        api_key_source: data.api_key_source || null,
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
    <>
      <AppPageHeader
        title="Credenciais OpenAI"
        description="Configure a API Key e o modelo usados nas análises de editais."
      />

      {loading ? (
        <p className="lab-app-empty">Carregando…</p>
      ) : (
        <section className="lab-app-panel lab-app-panel--narrow">
          <form className="lab-app-form" onSubmit={handleSave}>
            {error ? (
              <div className="lab-app-alert lab-app-alert--error">{error}</div>
            ) : null}
            {message ? (
              <div className="lab-app-alert lab-app-alert--success">{message}</div>
            ) : null}
            {meta.api_key_decrypt_failed ? (
              <div className="lab-app-alert lab-app-alert--warning">
                A chave salva no banco não pode ser lida (APP_KEY do servidor mudou).
                Cole a API Key novamente abaixo e clique em Salvar, ou defina{" "}
                <code>OPENAI_API_KEY</code> no <code>backend/.env</code> do servidor.
              </div>
            ) : null}
            {meta.api_key_source === "env" && meta.has_api_key ? (
              <div className="lab-app-alert lab-app-alert--success">
                Usando <code>OPENAI_API_KEY</code> do ambiente do servidor.
                Salve no painel para gravar no banco com o APP_KEY atual.
              </div>
            ) : null}

            <div className="lab-app-form__grid">
              <label className="lab-app-field lab-app-field--full">
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

              <label className="lab-app-field lab-app-field--full">
                <span>Base URL</span>
                <input
                  name="base_url"
                  value={form.base_url}
                  onChange={handleChange}
                  placeholder="https://api.openai.com/v1"
                />
              </label>

              <label className="lab-app-field">
                <span>Modelo</span>
                <input
                  name="model"
                  value={form.model}
                  onChange={handleChange}
                  placeholder="gpt-4o-mini"
                />
              </label>

              <label className="lab-app-field lab-app-field--checkbox">
                <input
                  name="is_active"
                  type="checkbox"
                  checked={form.is_active}
                  onChange={handleChange}
                />
                <span>Credencial ativa</span>
              </label>
            </div>

            <div className="lab-app-form__actions">
              <button
                type="button"
                className="lab-app-btn lab-app-btn--ghost"
                onClick={handleTest}
                disabled={testing || !meta.has_api_key}
              >
                {testing ? "Testando…" : "Testar conexão"}
              </button>
              <button
                type="submit"
                className="lab-app-btn lab-app-btn--primary"
                disabled={saving}
              >
                {saving ? "Salvando…" : "Salvar credenciais"}
              </button>
            </div>
          </form>
        </section>
      )}
    </>
  );
};
