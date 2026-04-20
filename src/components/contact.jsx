import React from "react";

export const Contact = (props) => {
  const d = props.data;

  return (
    <div>
      <div id="contact">
        <div className="container">
          <div className="row">
            <div className="col-md-8 col-md-offset-2 text-center contact-whatsapp-only">
              <div className="section-title">
                <h2>{d ? d.sectionTitle : "Contato"}</h2>
                <p>{d ? d.sectionLead : ""}</p>
              </div>
              {d && d.whatsappUrl ? (
                <>
                  <a
                    href={d.whatsappUrl}
                    className="contact-whatsapp-btn contact-whatsapp-btn--hero"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="fa fa-whatsapp" aria-hidden="true"></i>
                    Conversar no WhatsApp
                  </a>
                  <p className="contact-whatsapp-num contact-whatsapp-num--hero">
                    {d.whatsappDisplay || d.phone}
                  </p>
                </>
              ) : null}
              {d && d.address ? (
                <p className="contact-address-line">
                  <i className="fa fa-map-marker" aria-hidden="true"></i>{" "}
                  {d.address}
                </p>
              ) : null}
              {d && d.phone ? (
                <p className="contact-phone-line">
                  <i className="fa fa-phone" aria-hidden="true"></i>{" "}
                  {d.whatsappUrl ? (
                    <a
                      href={d.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {d.phone}
                    </a>
                  ) : (
                    d.phone
                  )}
                </p>
              ) : null}
            </div>
          </div>
          <div className="row">
            <div className="col-md-12">
              <div className="social">
                <ul>
                  {d && d.linkedin ? (
                    <li>
                      <a
                        href={d.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="LinkedIn"
                      >
                        <i className="fa fa-linkedin"></i>
                      </a>
                    </li>
                  ) : null}
                  {d && d.instagram ? (
                    <li>
                      <a
                        href={d.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Instagram"
                      >
                        <i className="fa fa-instagram"></i>
                      </a>
                    </li>
                  ) : null}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div id="footer">
        <div className="container text-center">
          <p>
            © {new Date().getFullYear()} 55LAB. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};
