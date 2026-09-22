import React from "react";

export const Clients = (props) => {
  const d = props.data;
  const items = d?.items || [];
  if (!items.length) return null;

  // Duplicate for seamless infinite marquee
  const trackItems = [...items, ...items];

  return (
    <section id="clientes" className="lab-section lab-section--soft">
      <div className="lab-container">
        <header className="lab-header-block lab-header-block--center">
          <span className="lab-eyebrow">{d.eyebrow}</span>
          <h2 className="lab-heading">{d.title}</h2>
          {d.lead ? (
            <p className="lab-lead lab-lead--center">{d.lead}</p>
          ) : null}
        </header>
      </div>

      <div className="lab-clients-slider" aria-label="Clientes com sistemas em operação">
        <div className="lab-clients-slider__viewport">
          <ul className="lab-clients-slider__track">
            {trackItems.map((item, i) => (
              <li
                key={`${item.slug}-${i}`}
                className="lab-client lab-client--slide"
                aria-hidden={i >= items.length ? true : undefined}
              >
                <div
                  className={`lab-client__logo${
                    item.logoSize === "lg" ? " lab-client__logo--lg" : ""
                  }`}
                >
                  <img
                    src={item.logo}
                    alt={i < items.length ? item.name : ""}
                    loading="lazy"
                  />
                </div>
                <span className="lab-client__name">{item.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
