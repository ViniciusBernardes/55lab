import React from "react";

export const Process = (props) => {
  return (
    <section id="processo" className="lab-section lab-section--light">
      <div className="lab-container">
        <header className="lab-header-block lab-header-block--center">
          <span className="lab-eyebrow">Como entregamos</span>
          <h2 className="lab-heading">Processo de desenvolvimento</h2>
          <p className="lab-lead lab-lead--center">
            Ciclo transparente, com artefatos técnicos em cada fase — para você
            acompanhar escopo, risco e data de release.
          </p>
        </header>
        <div className="lab-process__grid">
          {props.data
            ? props.data.map((d, i) => (
                <article key={`${d.step}-${i}`} className="lab-step">
                  <div className="lab-step__num">{d.step}</div>
                  <h3 className="lab-step__title">{d.title}</h3>
                  <p className="lab-step__text">{d.text}</p>
                </article>
              ))
            : null}
        </div>
      </div>
    </section>
  );
};
