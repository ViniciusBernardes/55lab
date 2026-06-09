import React from "react";
import { Link } from "react-router-dom";

export function EditalBreadcrumb({ items = [] }) {
  return (
    <nav className="lab-edital-breadcrumb" aria-label="Navegação">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={`${item.label}-${index}`} className="lab-edital-breadcrumb__item">
            {index > 0 ? (
              <i className="fa fa-angle-right" aria-hidden="true" />
            ) : null}
            {item.to && !isLast ? (
              <Link to={item.to}>{item.label}</Link>
            ) : (
              <span aria-current={isLast ? "page" : undefined}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
