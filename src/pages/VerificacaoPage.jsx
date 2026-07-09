import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { verificarDocumento } from "../api/assinaturaApi";
import { VerificacaoView } from "../components/assinatura/VerificacaoView";

export const VerificacaoPage = () => {
  const { codigo } = useParams();
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const result = await verificarDocumento(codigo);
        setDados({
          ...result,
          url_verificacao: result.url_verificacao || `${window.location.origin}/verificacao/${codigo}`,
        });
      } catch (err) {
        setError(err.message || "Código de verificação não encontrado.");
      } finally {
        setLoading(false);
      }
    };

    if (codigo) {
      load();
    }
  }, [codigo]);

  if (loading) {
    return (
      <div className="lab-verificacao">
        <div className="lab-verificacao__loading">Verificando assinaturas...</div>
      </div>
    );
  }

  if (error || !dados) {
    return (
      <div className="lab-verificacao">
        <div className="lab-verificacao__error">
          <h2>Verificação não encontrada</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return <VerificacaoView dados={dados} />;
};
