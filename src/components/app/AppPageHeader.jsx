import React from "react";

export function AppPageHeader({ title, description, actions }) {
  return (
    <header className="lab-app-header">
      <div className="lab-app-header__content">
        <h1 className="lab-app-header__title">{title}</h1>
        {description ? (
          <p className="lab-app-header__desc">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="lab-app-header__actions">{actions}</div> : null}
    </header>
  );
}
