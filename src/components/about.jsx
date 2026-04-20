import React from "react";

export const About = (props) => {
  return (
    <div id="about">
      <div className="container">
        <div className="row">
          <div className="col-xs-12 col-md-6">
            <img
              src="img/about.jpg"
              className="img-responsive"
              alt="Ambiente de trabalho e colaboração em projeto de software"
            />
          </div>
          <div className="col-xs-12 col-md-6">
            <div className="about-text">
              <h2>Sobre a 55LAB</h2>
              <p>{props.data ? props.data.paragraph : "Carregando…"}</p>
              <h3>Por que trabalhar conosco</h3>
              <div className="list-style">
                <div className="col-lg-6 col-sm-6 col-xs-12">
                  <ul>
                    {props.data
                      ? props.data.Why.map((item, i) => (
                          <li key={`${item}-${i}`}>{item}</li>
                        ))
                      : null}
                  </ul>
                </div>
                <div className="col-lg-6 col-sm-6 col-xs-12">
                  <ul>
                    {props.data
                      ? props.data.Why2.map((item, i) => (
                          <li key={`${item}-${i}`}>{item}</li>
                        ))
                      : null}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
