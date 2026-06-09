import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="lab-app lab-app--loading">
        <div className="lab-app-loading">Carregando…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/editais/login" state={{ from: location }} replace />;
  }

  return children;
}
