import React from "react";

export const Contact = (props) => {
  const d = props.data;
  if (!d) return null;

  return (
    <>
      <section id="contato" className="lab-contact">
        <div className="lab-container">
          <span className="lab-eyebrow">Fale com engenharia</span>
          <h2 className="lab-heading">{d.sectionTitle}</h2>
          <p className="lab-lead lab-lead--center">{d.sectionLead}</p>
          <div className="lab-contact__channels">
            {d.whatsappUrl ? (
              <a
                href={d.whatsappUrl}
                className="lab-btn lab-btn--whatsapp"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fa fa-whatsapp" aria-hidden="true" /> WhatsApp —{" "}
                {d.whatsappDisplay}
              </a>
            ) : null}
          </div>
          {d.address ? (
            <p className="lab-contact__meta">
              <i className="fa fa-map-marker" aria-hidden="true" /> {d.address}
            </p>
          ) : null}
          <div className="lab-contact__social">
            {d.linkedin ? (
              <a
                href={d.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <i className="fa fa-linkedin" />
              </a>
            ) : null}
            {d.instagram ? (
              <a
                href={d.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <i className="fa fa-instagram" />
              </a>
            ) : null}
          </div>
        </div>
      </section>
      <footer className="lab-footer">
        <div className="lab-container">
          <p>© {new Date().getFullYear()} 55LAB — Desenvolvimento de sistemas</p>
        </div>
      </footer>
    </>
  );
};
