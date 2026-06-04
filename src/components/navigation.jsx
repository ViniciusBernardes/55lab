import React, { useState } from "react";

export const Navigation = (props) => {
  const logoSrc = props.logoSrc || "img/55lab-logo.svg";
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <header className="lab-nav">
      <div className="lab-container lab-nav__inner">
        <a className="lab-nav__brand" href="#page-top" onClick={close}>
          <img src={logoSrc} alt="55LAB" width="220" height="44" />
        </a>
        <button
          type="button"
          className="lab-nav__toggle"
          aria-expanded={open}
          aria-label="Abrir ou fechar menu"
          onClick={() => setOpen(!open)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav
          className={`lab-nav__menu${open ? " is-open" : ""}`}
          aria-label="Principal"
        >
          <a href="#servicos" onClick={close}>
            Serviços
          </a>
          <a href="#produtos" onClick={close}>
            Produtos
          </a>
          <a href="#stack" onClick={close}>
            Stack
          </a>
          <a href="#processo" onClick={close}>
            Processo
          </a>
          <a href="#sobre" onClick={close}>
            Sobre
          </a>
          <a href="#projetos" onClick={close}>
            Projetos
          </a>
          <a href="#contato" className="lab-nav__cta" onClick={close}>
            Contato
          </a>
        </nav>
      </div>
    </header>
  );
};
