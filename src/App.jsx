import React from "react";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import SmoothScroll from "smooth-scroll";
import { AppLayout } from "./components/app/AppLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { DashboardPage } from "./pages/DashboardPage";
import { EditaisPage } from "./pages/EditaisPage";
import { EditalDetailPage } from "./pages/EditalDetailPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { OpenAiCredentialsPage } from "./pages/OpenAiCredentialsPage";

new SmoothScroll('a[href*="#"]', {
  speed: 800,
  speedAsDuration: true,
});

function LegacyEditalRedirect() {
  const { id } = useParams();
  return <Navigate to={`/app/editais/${id}`} replace />;
}

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="lab-site">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/editais/login" element={<LoginPage />} />

            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="editais" element={<EditaisPage />} />
              <Route path="editais/credenciais" element={<OpenAiCredentialsPage />} />
              <Route path="editais/:id" element={<EditalDetailPage />} />
            </Route>

            <Route path="/editais" element={<Navigate to="/app/editais" replace />} />
            <Route
              path="/editais/credenciais"
              element={<Navigate to="/app/editais/credenciais" replace />}
            />
            <Route path="/editais/:id" element={<LegacyEditalRedirect />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
