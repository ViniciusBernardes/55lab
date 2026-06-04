import React from "react";

export const Header = (props) => {
  const d = props.data;
  if (!d) return null;

  return (
    <section className="lab-hero" id="page-top">
      <div className="lab-hero__grid-bg" aria-hidden="true" />
      <div className="lab-hero__glow" aria-hidden="true" />
      <div className="lab-container lab-hero__layout">
        <div className="lab-hero__copy">
          <span className="lab-eyebrow">{d.eyebrow}</span>
          <h1 className="lab-hero__title">
            {d.title}{" "}
            <em>{d.titleAccent}</em>
          </h1>
          <p className="lab-hero__text">{d.paragraph}</p>
          <div className="lab-hero__actions">
            <a href="#contato" className="lab-btn lab-btn--primary page-scroll">
              {d.ctaPrimary}
            </a>
            <a href="#projetos" className="lab-btn lab-btn--ghost page-scroll">
              {d.ctaSecondary}
            </a>
          </div>
        </div>
        <div className="lab-hero__code-wrap">
          <div className="lab-code" aria-hidden="true">
            <div className="lab-code__bar">
              <span className="lab-code__dot lab-code__dot--r" />
              <span className="lab-code__dot lab-code__dot--y" />
              <span className="lab-code__dot lab-code__dot--g" />
              <span className="lab-code__file">deploy.ts</span>
            </div>
            <div className="lab-code__body">
              <pre>
                <code>
                  <span className="kw">const</span> entrega ={" "}
                  <span className="kw">await</span>{" "}
                  <span className="fn">buildSistema</span>
                  {"({\n"}
                  {"  "}
                  <span className="key">stack</span>: [
                  <span className="str">'Node'</span>,{" "}
                  <span className="str">'React'</span>,{" "}
                  <span className="str">'PostgreSQL'</span>],
                  {"\n  "}
                  <span className="key">integracoes</span>: [
                  <span className="str">'ERP'</span>,{" "}
                  <span className="str">'APIs'</span>],
                  {"\n  "}
                  <span className="key">qualidade</span>:{" "}
                  <span className="str">'testes + code review'</span>,
                  {"\n  "}
                  <span className="key">deploy</span>:{" "}
                  <span className="str">'CI/CD → produção'</span>,
                  {"\n});\n\n"}
                  <span className="cm">
                    {"// 55LAB — software que escala com o negócio"}
                  </span>
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
