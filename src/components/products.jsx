import React from "react";

export const Products = (props) => {
  const section = props.data;
  const items = props.items;
  if (!items?.length) return null;

  return (
    <section id="produtos" className="lab-section lab-section--dark">
      <div className="lab-container">
        <header className="lab-header-block lab-header-block--center">
          <span className="lab-eyebrow">
            {section?.eyebrow || "Portfólio de produtos"}
          </span>
          <h2 className="lab-heading">
            {section?.title || "Software no mercado"}
          </h2>
          <p className="lab-lead lab-lead--center">
            {section?.lead ||
              "Plataformas SaaS da 55LAB em produção para gestão pública municipal."}
          </p>
        </header>
        <div className="lab-services__grid">
          {items.map((p, i) => (
            <article key={`${p.slug}-${i}`} className="lab-card">
              <div className="lab-card__icon">
                <i className={p.icon} aria-hidden="true" />
              </div>
              <h3 className="lab-card__title">{p.name}</h3>
              <p className="lab-card__text">{p.text || p.description}</p>
              {p.tags || p.stack ? (
                <div className="lab-tags">
                  {(p.tags || p.stack).map((tag) => (
                    <span key={tag} className="lab-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
              {p.url ? (
                <a
                  href={p.url}
                  className="lab-card__link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {p.domain || p.url.replace(/^https?:\/\//, "")}
                  <i className="fa fa-external-link" aria-hidden="true" />
                </a>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
