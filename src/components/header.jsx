import React from "react";
import { CodeTyping } from "./codeTyping";
import { HeroTechStack } from "./heroTechStack";

export const Header = (props) => {
  const d = props.data;
  if (!d) return null;

  return (
    <section className="lab-hero" id="page-top">
      <div className="lab-hero__grid-bg" aria-hidden="true" />
      <div className="lab-hero__glow" aria-hidden="true" />
      <div className="lab-container lab-hero__inner">
        <div className="lab-hero__main">
          <div className="lab-hero__copy">
            <span className="lab-eyebrow">{d.eyebrow}</span>
            <h1 className="lab-hero__title">
              {d.title}{" "}
              <em>{d.titleAccent}</em>
            </h1>
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
          <div className="lab-hero__code-wrap">
            <div className="lab-code" aria-hidden="true">
              <div className="lab-code__bar">
                <span className="lab-code__dot lab-code__dot--r" />
                <span className="lab-code__dot lab-code__dot--y" />
                <span className="lab-code__dot lab-code__dot--g" />
                <span className="lab-code__file">deploy.ts</span>
              </div>
              <div className="lab-code__body lab-code__body--typing">
                <CodeTyping />
              </div>
            </div>
          </div>
        </div>
        <HeroTechStack
          label={d.techLabel}
          items={d.techStack}
          wide
        />
      </div>
    </section>
  );
};
