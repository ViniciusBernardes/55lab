import React from "react";

export const TechStack = (props) => {
  const d = props.data;
  if (!d) return null;

  return (
    <section id="stack" className="lab-section lab-section--dark">
      <div className="lab-container">
        <header className="lab-header-block lab-header-block--center">
          <span className="lab-eyebrow">Tecnologia</span>
          <h2 className="lab-heading">{d.title}</h2>
        </header>
        <div className="lab-tech__cloud">
          {d.items.map((item) => (
            <span key={item} className="lab-tech__pill">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
