import React from "react";

export const Gallery = (props) => {
  return (
    <section id="projetos" className="lab-section lab-section--dark">
      <div className="lab-container">
        <header className="lab-header-block lab-header-block--center">
          <span className="lab-eyebrow">Portfólio</span>
          <h2 className="lab-heading">Projetos e entregas</h2>
          <p className="lab-lead lab-lead--center">
            Amostra de sistemas, integrações e automações — detalhes sob NDA
            mediante solicitação.
          </p>
        </header>
        <div className="lab-projects__grid">
          {props.data
            ? props.data.map((d, i) => (
                <article key={`${d.title}-${i}`} className="lab-project">
                  <div className="lab-project__img">
                    <img src={d.smallImage} alt={d.title} loading="lazy" />
                  </div>
                  <div className="lab-project__body">
                    {d.tag ? (
                      <div className="lab-project__tag">{d.tag}</div>
                    ) : null}
                    <h3 className="lab-project__title">{d.title}</h3>
                  </div>
                </article>
              ))
            : "Carregando…"}
        </div>
      </div>
    </section>
  );
};
