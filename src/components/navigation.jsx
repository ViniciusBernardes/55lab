import React, { useEffect, useState } from "react";

export const Navigation = (props) => {
  const logoSrc = props.logoSrc || "/img/55lab-logo.svg";
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const close = () => setOpen(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`lab-nav lab-nav--hero${scrolled || open ? " is-solid" : ""}`}
    >
      <div className="lab-container lab-nav__inner">
        <a className="lab-nav__brand" href="#page-top" onClick={close}>
          <img src={logoSrc} alt="55LAB" width="180" height="36" />
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
          <a href="#produtos" onClick={close}>
            Soluções
          </a>
          <a href="#areas" onClick={close}>
            Áreas
          </a>
          <a href="#sobre" onClick={close}>
            Sobre
          </a>
          <a href="#clientes" onClick={close}>
            Clientes
          </a>
          <a href="#contato" className="lab-nav__cta" onClick={close}>
            Fale com vendas
          </a>
          <a href="/editais/login" className="lab-nav__login" onClick={close}>
            Entrar
          </a>
        </nav>
      </div>
    </header>
  );
};
