import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { appNavItems } from "../../config/appNav";

export function AppSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/editais/login", { replace: true });
  };

  return (
    <aside className="lab-app-sidebar">
      <div className="lab-app-sidebar__brand">
        <img src="/img/55lab-logo.svg" alt="55LAB" width="140" height="28" />
        <span>Acesso interno</span>
      </div>

      <nav className="lab-app-sidebar__nav" aria-label="Painel">
        {appNavItems.map((item) =>
          item.type === "section" ? (
            <span key={item.label} className="lab-app-sidebar__section">
              {item.label}
            </span>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `lab-app-sidebar__link${isActive ? " is-active" : ""}`
              }
            >
              <i className={`fa ${item.icon}`} aria-hidden="true" />
              {item.label}
            </NavLink>
          ),
        )}
      </nav>

      <div className="lab-app-sidebar__footer">
        {user ? (
          <div className="lab-app-sidebar__user">
            <span className="lab-app-sidebar__user-name">{user.name}</span>
            <span className="lab-app-sidebar__user-email">{user.email}</span>
          </div>
        ) : null}
        <button type="button" className="lab-app-sidebar__logout" onClick={handleLogout}>
          <i className="fa fa-sign-out" aria-hidden="true" /> Sair
        </button>
        <a className="lab-app-sidebar__site" href="/">
          Voltar ao site
        </a>
      </div>
    </aside>
  );
}
