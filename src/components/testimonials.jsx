import React from "react";

export const Testimonials = (props) => {
  return (
    <section id="depoimentos" className="lab-section lab-section--soft">
      <div className="lab-container">
        <header className="lab-header-block lab-header-block--center">
          <span className="lab-eyebrow">Depoimentos</span>
          <h2 className="lab-heading">O que nossos clientes têm a dizer</h2>
        </header>
        <div className="lab-quotes__grid">
          {props.data
            ? props.data.map((d, i) => (
                <blockquote key={`${d.name}-${i}`} className="lab-quote">
                  <p className="lab-quote__text">{d.text}</p>
                  <footer>
                    <div className="lab-quote__author">{d.name}</div>
                    <div className="lab-quote__sector">{d.sector}</div>
                  </footer>
                </blockquote>
              ))
            : null}
        </div>
      </div>
    </section>
  );
};
