import React from "react";

export const Clients = (props) => {
  const d = props.data;
  if (!d?.items?.length) return null;

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
        <ul className="lab-clients__grid">
          {d.items.map((item) => (
            <li key={item.slug} className="lab-client">
              <div
                className={`lab-client__logo${
                  item.logoSize === "lg" ? " lab-client__logo--lg" : ""
                }`}
              >
                <img src={item.logo} alt={item.name} loading="lazy" />
              </div>
              <span className="lab-client__name">{item.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
