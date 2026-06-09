import React, { useMemo, useState } from "react";
import { updateEdital } from "../../api/licitacaoApi";
import {
  hasAnalysisFormData,
  mapAnalysisToForm,
  mapEditalToForm,
} from "../../utils/editalFromAnalysis";
import { EditalForm } from "./EditalForm";

export function EditalEditTab({ edital, analysisSnapshot, onSaved }) {
  const [formValues, setFormValues] = useState(() => mapEditalToForm(edital));
  const [message, setMessage] = useState("");
  const canApplyAi = useMemo(
    () => hasAnalysisFormData(analysisSnapshot),
    [analysisSnapshot],
  );

  const handleApplyAi = () => {
    setFormValues(mapAnalysisToForm(edital, analysisSnapshot));
    setMessage("Campos preenchidos com os dados da análise. Revise e salve.");
  };

  const handleSubmit = async (payload) => {
    const updated = await updateEdital(edital.id, payload);
    setFormValues(mapEditalToForm(updated));
    setMessage("Dados do edital atualizados com sucesso.");
    if (onSaved) {
      await onSaved();
    }
  };

  return (
    <section className="lab-app-panel">
      <div className="lab-app-panel__head">
        <div>
          <h2 className="lab-app-panel__title">Editar dados do edital</h2>
          <p className="lab-app-panel__subtitle">
            Ajuste as informações extraídas pela IA ou complemente manualmente antes de salvar.
          </p>
        </div>
        <button
          type="button"
          className="lab-app-btn lab-app-btn--ghost"
          onClick={handleApplyAi}
          disabled={!canApplyAi}
        >
          Preencher com dados da IA
        </button>
      </div>

      {!canApplyAi ? (
        <div className="lab-app-alert lab-app-alert--warning">
          Execute a análise por IA para importar automaticamente os dados do edital.
        </div>
      ) : null}

      {message ? (
        <div className="lab-app-alert lab-app-alert--success">{message}</div>
      ) : null}

      <EditalForm
        initial={formValues}
        onSubmit={handleSubmit}
        submitLabel="Salvar alterações"
      />
    </section>
  );
}
