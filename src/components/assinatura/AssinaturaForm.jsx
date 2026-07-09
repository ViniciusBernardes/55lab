import React, { useEffect, useState } from "react";
import { listCertificados } from "../../api/assinaturaApi";

const PAPEIS = [
  "Parte",
  "Testemunha",
  "Contratante",
  "Contratado",
  "Representante Legal",
];

export function AssinaturaForm({ onAssinar, loading: externalLoading }) {
  const [certificados, setCertificados] = useState([]);
  const [certificadoId, setCertificadoId] = useState("");
  const [modo, setModo] = useState("salvo");
  const [certificado, setCertificado] = useState(null);
  const [senha, setSenha] = useState("");
  const [papel, setPapel] = useState("Parte");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isLoading = loading || externalLoading;

  useEffect(() => {
    listCertificados()
      .then((data) => {
        const items = data.data || [];
        setCertificados(items);
        const padrao = items.find((c) => c.is_padrao) || items[0];
        if (padrao) {
          setCertificadoId(String(padrao.id));
          setModo("salvo");
        } else {
          setModo("upload");
        }
      })
      .catch(() => setModo("upload"));
  }, []);

  const selectedCert = certificados.find((c) => String(c.id) === certificadoId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (modo === "salvo") {
      if (!certificadoId) {
        setError("Selecione um certificado cadastrado.");
        return;
      }
    } else if (!certificado || !senha) {
      setError("Informe o certificado digital (.pfx) e a senha.");
      return;
    }

    setLoading(true);
    try {
      if (modo === "salvo") {
        await onAssinar({ certificadoId: Number(certificadoId), papel });
      } else {
        await onAssinar({ certificado, senha, papel });
        setCertificado(null);
        setSenha("");
      }
    } catch (err) {
      setError(err.message || "Erro ao assinar documento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="lab-assinatura-sign-panel">
      <header className="lab-assinatura-sign-panel__header">
        <div className="lab-assinatura-sign-panel__brand">
          <img
            src={`${process.env.PUBLIC_URL || ""}/images/icp-brasil-logo.png`}
            alt="ICP-Brasil"
            width="40"
            height="50"
          />
          <div>
            <h3>Assinar documento</h3>
            <p>Certificado digital ICP-Brasil A1</p>
          </div>
        </div>
      </header>

      <div className="lab-assinatura-sign-panel__body">
        {error && <div className="lab-app-alert lab-app-alert--error">{error}</div>}

        {certificados.length > 0 && (
          <div className="lab-assinatura-sign-modes">
            <button
              type="button"
              className={`lab-assinatura-sign-mode${modo === "salvo" ? " is-active" : ""}`}
              onClick={() => setModo("salvo")}
            >
              <i className="fa fa-id-card" aria-hidden="true" /> Certificado salvo
            </button>
            <button
              type="button"
              className={`lab-assinatura-sign-mode${modo === "upload" ? " is-active" : ""}`}
              onClick={() => setModo("upload")}
            >
              <i className="fa fa-upload" aria-hidden="true" /> Enviar .pfx
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="lab-assinatura-sign-form">
          {modo === "salvo" && certificados.length > 0 ? (
            <>
              <div className="lab-app-field">
                <label htmlFor="cert-salvo">Certificado</label>
                <select
                  id="cert-salvo"
                  className="lab-app-input"
                  value={certificadoId}
                  onChange={(e) => setCertificadoId(e.target.value)}
                  required
                >
                  {certificados.map((c) => (
                    <option key={c.id} value={c.id} disabled={!c.is_valido}>
                      {c.apelido} — {c.titular_nome}
                      {!c.is_valido ? " (expirado)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCert && (
                <div className="lab-assinatura-cert-preview">
                  <div>
                    <span>Titular</span>
                    <strong>{selectedCert.titular_nome}</strong>
                  </div>
                  <div>
                    <span>CPF</span>
                    <strong>{selectedCert.titular_cpf_mascarado || "—"}</strong>
                  </div>
                  <div>
                    <span>Validade</span>
                    <strong>
                      {selectedCert.validade_certificado
                        ? new Date(selectedCert.validade_certificado).toLocaleDateString("pt-BR")
                        : "—"}
                    </strong>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="lab-app-field">
                <label htmlFor="certificado-pfx">Certificado (.pfx / .p12)</label>
                <input
                  id="certificado-pfx"
                  type="file"
                  className="lab-app-input"
                  accept=".pfx,.p12"
                  onChange={(e) => setCertificado(e.target.files?.[0] || null)}
                  required={modo === "upload"}
                />
              </div>
              <div className="lab-app-field">
                <label htmlFor="senha-cert">Senha do certificado</label>
                <input
                  id="senha-cert"
                  type="password"
                  className="lab-app-input"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Senha do arquivo .pfx"
                  autoComplete="off"
                  required={modo === "upload"}
                />
              </div>
            </>
          )}

          <div className="lab-app-field">
            <label htmlFor="papel-signatario">Papel do signatário</label>
            <select
              id="papel-signatario"
              className="lab-app-input"
              value={papel}
              onChange={(e) => setPapel(e.target.value)}
            >
              {PAPEIS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="lab-app-btn lab-app-btn--primary lab-assinatura-sign-submit"
            disabled={isLoading || (modo === "salvo" && selectedCert && !selectedCert.is_valido)}
          >
            {isLoading ? (
              <>
                <i className="fa fa-spinner fa-spin" aria-hidden="true" /> Assinando...
              </>
            ) : (
              <>
                <i className="fa fa-pencil-square-o" aria-hidden="true" /> Assinar documento
              </>
            )}
          </button>
        </form>
      </div>
    </article>
  );
}
