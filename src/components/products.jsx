import React from "react";

export const Products = (props) => {
  const section = props.data;
  const items = props.items;
  if (!items?.length) return null;

  return (
    <section id="produtos" className="lab-section lab-section--light">
      <div className="lab-container">
        <header className="lab-header-block lab-header-block--center">
          <span className="lab-eyebrow">
            {section?.eyebrow || "Nossas soluções"}
          </span>
          <h2 className="lab-heading">
            {section?.title || "Conheça nossas soluções"}
          </h2>
          <p className="lab-lead lab-lead--center">
            {section?.lead ||
              "Sistemas da 55LAB para modernizar a administração pública."}
          </p>
        </header>
        <div className="lab-products__grid">
          {items.map((p, i) => (
            <article key={`${p.slug}-${i}`} className="lab-product">
              {p.cover ? (
                <div className="lab-product__cover">
                  <img src={p.cover} alt={p.name} loading="lazy" />
                </div>
              ) : (
                <div className="lab-product__icon" aria-hidden="true">
                  <i className={p.icon} />
                </div>
              )}
              <div className="lab-product__body">
                {p.category ? (
                  <span className="lab-product__category">{p.category}</span>
                ) : null}
                <h3 className="lab-product__title">{p.name}</h3>
                <p className="lab-product__text">{p.text}</p>
                {p.tags?.length ? (
                  <div className="lab-tags">
                    {p.tags.map((tag) => (
                      <span key={tag} className="lab-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
                {p.url ? (
                  <a
                    href={p.url}
                    className="lab-product__link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {p.domain || "Saiba mais"}
                    <i className="fa fa-external-link" aria-hidden="true" />
                  </a>
                ) : (
                  <a href="#contato" className="lab-product__link page-scroll">
                    Fale com vendas
                    <i className="fa fa-arrow-right" aria-hidden="true" />
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
        {section?.note ? (
          <p className="lab-products__note">{section.note}</p>
        ) : null}
      </div>
    </section>
  );
};
