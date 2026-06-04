import React from "react";

export const About = (props) => {
  const d = props.data;
  if (!d) return null;

  return (
    <section id="sobre" className="lab-section lab-section--dark">
      <div className="lab-container lab-about__grid">
        <div className="lab-about__visual">
          <img
            src="img/about.jpg"
            alt="Equipe em revisão de arquitetura e código"
          />
        </div>
        <div>
          <span className="lab-eyebrow">{d.eyebrow}</span>
          <h2 className="lab-heading">{d.title}</h2>
          <p className="lab-lead">{d.paragraph}</p>
          <ul className="lab-checklist">
            {d.highlights.map((item, i) => (
              <li key={`${item}-${i}`}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
