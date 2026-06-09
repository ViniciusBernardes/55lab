import React, { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("admin@55lab.com.br");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = location.state?.from?.pathname || "/app";

  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || "Não foi possível entrar.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="lab-site lab-editais">
      <main className="lab-editais-main lab-editais-login">
        <div className="lab-container">
          <div className="lab-editais-login__card">
            <Link className="lab-editais-login__brand" to="/">
              <img src="/img/55lab-logo.svg" alt="55LAB" width="180" height="36" />
            </Link>

            <span className="lab-eyebrow">Acesso interno</span>
            <h1 className="lab-heading">Entrar</h1>
            <p className="lab-lead">
              Acesse o painel interno com seu e-mail e senha.
            </p>

            {error ? (
              <div className="lab-editais-alert lab-editais-alert--error">{error}</div>
            ) : null}

            <form className="lab-editais-form" onSubmit={handleSubmit}>
              <label className="lab-editais-field lab-editais-field--full">
                <span>E-mail</span>
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              <label className="lab-editais-field lab-editais-field--full">
                <span>Senha</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>

              <div className="lab-editais-form__actions">
                <Link className="lab-btn lab-btn--ghost" to="/">
                  Voltar ao site
                </Link>
                <button
                  type="submit"
                  className="lab-btn lab-btn--primary"
                  disabled={submitting}
                >
                  {submitting ? "Entrando…" : "Entrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
