import React, { useEffect, useState } from "react";

export const Header = (props) => {
  const d = props.data;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setReady(true);
      return undefined;
    }
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!d) return null;

  return (
    <section
      className={`lab-hero lab-hero--corporate${ready ? " is-ready" : ""}`}
      id="page-top"
    >
      <div className="lab-hero__media" aria-hidden="true">
        <img
          src={d.image || "/img/hero-civic.webp"}
          alt=""
          className="lab-hero__photo"
          fetchPriority="high"
        />
        <div className="lab-hero__veil" />
      </div>

      <div className="lab-container lab-hero__inner">
        <div className="lab-hero__copy">
          <p className="lab-hero__brand">{d.brand || "55LAB"}</p>
          <span className="lab-eyebrow">{d.eyebrow}</span>
          <h1 className="lab-hero__title">{d.title}</h1>
          <p className="lab-hero__text">{d.paragraph}</p>
          <div className="lab-hero__actions">
            <a href="#contato" className="lab-btn lab-btn--primary page-scroll">
              {d.ctaPrimary}
            </a>
            <a href="#produtos" className="lab-btn lab-btn--ghost page-scroll">
              {d.ctaSecondary}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
