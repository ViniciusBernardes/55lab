import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  createExternalSystem,
  deleteExternalSystem,
  listExternalSystems,
  testExternalSystemWebhook,
  updateExternalSystem,
} from "../api/helpdeskApi";
import { AppPageHeader } from "../components/app/AppPageHeader";
import { ConfirmModal } from "../components/editais/ConfirmModal";

const EMPTY_FORM = {
  code: "",
  name: "",
  webhook_url: "",
  description: "",
  is_active: true,
};

export const HelpdeskIntegrationsPage = () => {
  const [systems, setSystems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadSystems = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await listExternalSystems();
      setSystems(data.data || []);
    } catch (err) {
      setError(err.message || "Não foi possível carregar as integrações.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSystems();
  }, [loadSystems]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setMessage("");
    setError("");
  };

  const handleEdit = (system) => {
    setEditingId(system.id);
    setForm({
      code: system.code,
      name: system.name,
      webhook_url: system.webhook_url,
      description: system.description || "",
      is_active: system.is_active,
    });
    setMessage("");
    setError("");
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      webhook_url: form.webhook_url.trim(),
      description: form.description.trim() || null,
      is_active: form.is_active,
    };

    try {
      if (editingId) {
        await updateExternalSystem(editingId, payload);
        setMessage("Integração atualizada com sucesso.");
      } else {
        await createExternalSystem(payload);
        setMessage("Integração cadastrada com sucesso.");
      }

      resetForm();
      await loadSystems();
    } catch (err) {
      setError(err.message || "Não foi possível salvar a integração.");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (system) => {
    setTestingId(system.id);
    setError("");
    setMessage("");

    try {
      const result = await testExternalSystemWebhook(system.id);
      setMessage(result.message || "Webhook testado com sucesso.");
    } catch (err) {
      setError(err.message || "Falha ao testar o webhook.");
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    setError("");

    try {
      await deleteExternalSystem(deleteTarget.id);
      if (editingId === deleteTarget.id) {
        resetForm();
      }
      setDeleteTarget(null);
      setMessage("Integração removida.");
      await loadSystems();
    } catch (err) {
      setError(err.message || "Não foi possível remover a integração.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <AppPageHeader
        title="Integrações Helpdesk"
        description="Cadastre cada sistema externo e a URL de webhook para receber atualizações de status."
        actions={
          <Link to="/app/tickets" className="lab-app-btn lab-app-btn--ghost">
            <i className="fa fa-arrow-left" aria-hidden="true" /> Voltar aos tickets
          </Link>
        }
      />

      <section className="lab-app-panel">
        <div className="lab-app-panel__head">
          <div>
            <h2 className="lab-app-panel__title">
              {editingId ? "Editar sistema externo" : "Novo sistema externo"}
            </h2>
            <p className="lab-app-panel__subtitle">
              O identificador deve ser igual ao campo{" "}
              <code>external_system</code> enviado na criação do ticket.
            </p>
          </div>
          {editingId ? (
            <button
              type="button"
              className="lab-app-btn lab-app-btn--ghost"
              onClick={resetForm}
            >
              Cancelar edição
            </button>
          ) : null}
        </div>

        <form className="lab-app-form" onSubmit={handleSubmit}>
          {error ? <div className="lab-app-alert lab-app-alert--error">{error}</div> : null}
          {message ? <div className="lab-app-alert lab-app-alert--success">{message}</div> : null}

          <div className="lab-app-form__grid">
            <label className="lab-app-field">
              <span>Identificador *</span>
              <input
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="sistema-cliente"
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                required
                disabled={Boolean(editingId)}
              />
            </label>

            <label className="lab-app-field">
              <span>Nome *</span>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Portal do Cliente"
                required
              />
            </label>

            <label className="lab-app-field lab-app-field--full">
              <span>URL do webhook *</span>
              <input
                name="webhook_url"
                type="url"
                value={form.webhook_url}
                onChange={handleChange}
                placeholder="https://sistema-cliente.com/api/helpdesk/webhook"
                required
              />
            </label>

            <label className="lab-app-field lab-app-field--full">
              <span>Descrição</span>
              <textarea
                name="description"
                rows="2"
                value={form.description}
                onChange={handleChange}
                placeholder="Sistema que envia tickets de suporte dos clientes."
              />
            </label>

            <label className="lab-app-field lab-app-field--checkbox">
              <input
                name="is_active"
                type="checkbox"
                checked={form.is_active}
                onChange={handleChange}
              />
              <span>Integração ativa</span>
            </label>
          </div>

          <div className="lab-app-form__actions">
            <button
              type="submit"
              className="lab-app-btn lab-app-btn--primary"
              disabled={saving}
            >
              {saving ? "Salvando…" : editingId ? "Salvar alterações" : "Adicionar sistema"}
            </button>
          </div>
        </form>
      </section>

      <section className="lab-app-panel lab-app-panel--flush">
        <div className="lab-app-panel__toolbar">
          <div>
            <strong>{loading ? "—" : systems.length}</strong>
            <span> sistemas cadastrados</span>
          </div>
        </div>

        {loading ? (
          <div className="lab-app-loading-block">
            <i className="fa fa-spinner fa-spin" aria-hidden="true" />
            <span>Carregando integrações…</span>
          </div>
        ) : systems.length === 0 ? (
          <div className="lab-app-empty lab-app-empty--large">
            <i className="fa fa-plug" aria-hidden="true" />
            <h3>Nenhuma integração cadastrada</h3>
            <p>
              Adicione o primeiro sistema externo para que os tickets recebam
              notificações de status no webhook correto.
            </p>
          </div>
        ) : (
          <div className="lab-app-table-wrap">
            <table className="lab-app-table lab-app-table--data">
              <thead>
                <tr>
                  <th>Sistema</th>
                  <th>Identificador</th>
                  <th>Webhook</th>
                  <th>Status</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {systems.map((system) => (
                  <tr key={system.id}>
                    <td>
                      <strong>{system.name}</strong>
                      {system.description ? (
                        <span className="lab-app-muted">{system.description}</span>
                      ) : null}
                    </td>
                    <td>
                      <code>{system.code}</code>
                    </td>
                    <td className="lab-helpdesk-webhook-cell">{system.webhook_url}</td>
                    <td>
                      <span
                        className={`lab-badge lab-badge--${
                          system.is_active ? "success" : "muted"
                        }`}
                      >
                        {system.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="lab-app-table__actions-cell">
                      <div className="lab-app-table__actions">
                        <button
                          type="button"
                          className="lab-app-btn lab-app-btn--ghost"
                          onClick={() => handleTest(system)}
                          disabled={testingId === system.id || !system.is_active}
                        >
                          {testingId === system.id ? "Testando…" : "Testar"}
                        </button>
                        <button
                          type="button"
                          className="lab-app-btn lab-app-btn--ghost"
                          onClick={() => handleEdit(system)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="lab-app-btn lab-app-btn--danger"
                          onClick={() => setDeleteTarget(system)}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Excluir integração"
        message={
          deleteTarget ? (
            <>
              <p>
                Tem certeza que deseja excluir <strong>{deleteTarget.name}</strong>?
              </p>
              <p className="lab-modal__hint">
                Tickets já recebidos permanecem no sistema, mas novas notificações
                não serão enviadas para este webhook.
              </p>
            </>
          ) : null
        }
        confirmLabel="Excluir"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => {
          if (!deleting) setDeleteTarget(null);
        }}
      />
    </>
  );
};
