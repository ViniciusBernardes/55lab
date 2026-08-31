import React from "react";

export const Contact = (props) => {
  const d = props.data;
  const products = props.products || [];
  if (!d) return null;

  return (
    <>
      <section id="contato" className="lab-contact lab-contact--corporate">
        <div className="lab-container">
          <span className="lab-eyebrow">Comercial</span>
          <h2 className="lab-heading">{d.sectionTitle}</h2>
          <p className="lab-lead lab-lead--center">{d.sectionLead}</p>
          <div className="lab-contact__channels">
            {d.whatsappUrl ? (
              <a
                href={d.whatsappUrl}
                className="lab-btn lab-btn--whatsapp"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fa fa-whatsapp" aria-hidden="true" /> WhatsApp —{" "}
                {d.whatsappDisplay}
              </a>
            ) : null}
            {d.email ? (
              <a href={`mailto:${d.email}`} className="lab-btn lab-btn--primary">
                <i className="fa fa-envelope" aria-hidden="true" /> {d.email}
              </a>
            ) : null}
          </div>
          {d.address ? (
            <p className="lab-contact__meta">
              <i className="fa fa-map-marker" aria-hidden="true" /> {d.address}
            </p>
          ) : null}
          <div className="lab-contact__social">
            {d.linkedin ? (
              <a
                href={d.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <i className="fa fa-linkedin" />
              </a>
            ) : null}
            {d.instagram ? (
              <a
                href={d.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <i className="fa fa-instagram" />
              </a>
            ) : null}
          </div>
        </div>
      </section>
      <footer className="lab-footer lab-footer--corporate">
        <div className="lab-container lab-footer__grid">
          <div className="lab-footer__brand">
            <img src="/img/55lab-logo.svg" alt="55LAB" width="160" height="32" />
            <p>
              Soluções digitais para a transformação do setor público.
            </p>
            {d.companyName ? (
              <p className="lab-footer__legal">{d.companyName}</p>
            ) : null}
            {d.cnpj ? (
              <p className="lab-footer__legal">CNPJ {d.cnpj}</p>
            ) : null}
          </div>
          <div className="lab-footer__col">
            <h3>Soluções</h3>
            <ul>
              {products.map((p) => (
                <li key={p.slug}>
                  {p.url ? (
                    <a href={p.url} target="_blank" rel="noopener noreferrer">
                      {p.name}
                    </a>
                  ) : (
                    <a href="#produtos">{p.name}</a>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="lab-footer__col">
            <h3>Institucional</h3>
            <ul>
              <li>
                <a href="#sobre">Sobre</a>
              </li>
              <li>
                <a href="#contato">Contato</a>
              </li>
              <li>
                <a href="/editais/login">Área do cliente</a>
              </li>
            </ul>
          </div>
          <div className="lab-footer__col">
            <h3>Contato</h3>
            <ul>
              {d.email ? (
                <li>
                  <a href={`mailto:${d.email}`}>{d.email}</a>
                </li>
              ) : null}
              {d.whatsappDisplay ? (
                <li>
                  <a href={d.whatsappUrl} target="_blank" rel="noopener noreferrer">
                    {d.whatsappDisplay}
                  </a>
                </li>
              ) : null}
              {d.address ? <li className="lab-footer__address">{d.address}</li> : null}
            </ul>
          </div>
        </div>
        <div className="lab-container lab-footer__bottom">
          <p>
            © {new Date().getFullYear()}{" "}
            {d.companyName || "55LAB"}
            {d.cnpj ? ` — CNPJ ${d.cnpj}` : ""} — Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </>
  );
};
