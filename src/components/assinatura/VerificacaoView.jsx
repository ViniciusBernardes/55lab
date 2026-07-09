import React from "react";

function IcpLogo() {
  return (
    <div className="lab-verificacao__logo">
      <img
        src={`${process.env.PUBLIC_URL || ""}/images/icp-brasil-logo.png`}
        alt="ICP-Brasil"
        width="64"
        height="81"
      />
    </div>
  );
}

function CheckIcon() {
  return (
    <span className="lab-verificacao__check" aria-hidden="true">
      <svg viewBox="0 0 16 16" width="14" height="14">
        <circle cx="8" cy="8" r="8" fill="#008040" />
        <path d="M4.5 8 L7 10.5 L11.5 5.5" stroke="#fff" strokeWidth="1.5" fill="none" />
      </svg>
    </span>
  );
}

export function VerificacaoView({ dados }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(dados.url_verificacao)}`;

  return (
    <div className="lab-verificacao">
      <div className="lab-verificacao__page">
        <header className="lab-verificacao__header">
          <IcpLogo />
          <h1 className="lab-verificacao__title">VERIFICAÇÃO DAS ASSINATURAS</h1>
          <img
            src={qrUrl}
            alt="QR Code de verificação"
            className="lab-verificacao__qr"
            width="80"
            height="80"
          />
        </header>

        <p className="lab-verificacao__codigo">
          Código para verificação: <strong>{dados.codigo_verificacao}</strong>
        </p>

        {dados.integridade_ok === false && (
          <div className="lab-verificacao__alert">
            Atenção: não foi possível confirmar a integridade do documento.
          </div>
        )}

        <p className="lab-verificacao__intro">
          Este documento foi assinado digitalmente pelos seguintes signatários nas datas indicadas:
        </p>

        <ul className="lab-verificacao__signatarios">
          {(dados.assinaturas || []).map((assinatura, index) => (
            <li key={index} className="lab-verificacao__signatario">
              <CheckIcon />
              <div className="lab-verificacao__signatario-info">
                <p className="lab-verificacao__signatario-nome">
                  <strong>
                    {assinatura.nome} (CPF {assinatura.cpf_mascarado})
                  </strong>{" "}
                  em {assinatura.assinado_em}
                </p>
                <p className="lab-verificacao__signatario-papel">
                  Papel: {assinatura.papel}
                </p>
                <p className="lab-verificacao__signatario-cadeia">
                  Emitido por: {assinatura.cadeia_certificadora}
                  {assinatura.icp_brasil && " (Assinatura ICP-Brasil)"}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <footer className="lab-verificacao__footer">
          <p>
            Para verificar a validade das assinaturas, acesse a Central de Verificação por meio do link:
          </p>
          <a
            href={dados.url_verificacao}
            className="lab-verificacao__link"
            target="_blank"
            rel="noopener noreferrer"
          >
            {dados.url_verificacao}
          </a>
        </footer>
      </div>
    </div>
  );
}
