import React from "react";

export const Services = (props) => {
  return (
    <div id="services" className="text-center">
      <div className="container">
        <div className="section-title">
          <h2>Serviços</h2>
          <p>
            Da concepção à sustentação: engenharia de software, integrações e
            práticas de entrega contínua para times de produto e de operações.
          </p>
        </div>
        <div className="row">
          {props.data
            ? props.data.map((d, i) => (
                <div key={`${d.name}-${i}`} className="col-md-4">
                  <i className={d.icon} aria-hidden="true"></i>
                  <div className="service-desc">
                    <h3>{d.name}</h3>
                    <p>{d.text}</p>
                  </div>
                </div>
              ))
            : "Carregando…"}
        </div>
      </div>
    </div>
  );
};
