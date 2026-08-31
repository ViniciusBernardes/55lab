import React from "react";

export const Sectors = (props) => {
  const d = props.data;
  if (!d?.items?.length) return null;

  return (
    <section id="areas" className="lab-section lab-section--soft">
      <div className="lab-container">
        <header className="lab-header-block lab-header-block--center">
          <span className="lab-eyebrow">{d.eyebrow}</span>
          <h2 className="lab-heading">{d.title}</h2>
          <p className="lab-lead lab-lead--center">{d.lead}</p>
        </header>
        <div className="lab-sectors__grid">
          {d.items.map((item, i) => (
            <article key={`${item.name}-${i}`} className="lab-sector">
              <div className="lab-sector__icon" aria-hidden="true">
                <i className={item.icon} />
              </div>
              <h3 className="lab-sector__title">{item.name}</h3>
              <p className="lab-sector__text">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
