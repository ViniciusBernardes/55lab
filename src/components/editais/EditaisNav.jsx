import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export const EditaisNav = ({ logoSrc = "/img/55lab-logo.svg" }) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const close = () => setOpen(false);
  const isEditais = location.pathname.startsWith("/editais");

  return (
    <header className="lab-nav">
      <div className="lab-container lab-nav__inner">
        <Link className="lab-nav__brand" to="/" onClick={close}>
          <img src={logoSrc} alt="55LAB" width="220" height="44" />
        </Link>
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
          <Link to="/" onClick={close}>
            Site
          </Link>
          <Link
            to="/editais"
            className={isEditais && location.pathname === "/editais" ? "is-active" : ""}
            onClick={close}
          >
            Editais
          </Link>
          <Link
            to="/editais/credenciais"
            className={location.pathname === "/editais/credenciais" ? "is-active" : ""}
            onClick={close}
          >
            OpenAI
          </Link>
          <a href="/#contato" className="lab-nav__cta" onClick={close}>
            Contato
          </a>
        </nav>
      </div>
    </header>
  );
};
