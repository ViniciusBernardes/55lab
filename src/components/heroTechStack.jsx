import React from "react";
import { TechStackTyping } from "./techStackTyping";

export const HeroTechStack = ({ label, items, wide }) => {
  if (!items?.length) return null;

  const className = wide
    ? "lab-hero-tech lab-hero-tech--wide lab-hero-tech--terminal"
    : "lab-hero-tech";

  return (
    <div className={className}>
      <p className="lab-hero-tech__label">{label || "Principais tecnologias"}</p>
      <div className="lab-code lab-code--stack">
        <div className="lab-code__bar">
          <span className="lab-code__dot lab-code__dot--r" />
          <span className="lab-code__dot lab-code__dot--y" />
          <span className="lab-code__dot lab-code__dot--g" />
          <span className="lab-code__file">stack.ts</span>
        </div>
        <div className="lab-code__body lab-code__body--stack">
          <TechStackTyping items={items} />
        </div>
      </div>
    </div>
  );
};
