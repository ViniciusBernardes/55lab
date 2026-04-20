import React from "react";

export const Header = (props) => {
  const d = props.data;
  return (
    <header id="header">
      <div className="intro">
        <div className="overlay">
          <div className="container">
            <div className="row">
              <div className="col-md-8 col-md-offset-2 intro-text">
                <h1>
                  {d ? d.title : "Carregando…"}
                  <span></span>
                </h1>
                <p>{d ? d.paragraph : ""}</p>
                <a
                  href="#services"
                  className="btn btn-custom btn-lg page-scroll"
                >
                  Ver serviços
                </a>{" "}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
