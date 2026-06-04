import React from "react";

export const Services = (props) => {
  return (
    <section id="servicos" className="lab-section lab-section--light">
      <div className="lab-container">
        <header className="lab-header-block lab-header-block--center">
          <span className="lab-eyebrow">O que desenvolvemos</span>
          <h2 className="lab-heading">Serviços de software e integração</h2>
          <p className="lab-lead lab-lead--center">
            Do monólito modular à API distribuída — escolhemos a arquitetura
            certa para o estágio do seu produto, não o hype do momento.
          </p>
        </header>
        <div className="lab-services__grid">
          {props.data
            ? props.data.map((d, i) => (
                <article key={`${d.name}-${i}`} className="lab-card">
                  <div className="lab-card__icon">
                    <i className={d.icon} aria-hidden="true" />
                  </div>
                  <h3 className="lab-card__title">{d.name}</h3>
                  <p className="lab-card__text">{d.text}</p>
                  {d.tags ? (
                    <div className="lab-tags">
                      {d.tags.map((tag) => (
                        <span key={tag} className="lab-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))
            : "Carregando…"}
        </div>
      </div>
    </section>
  );
};
