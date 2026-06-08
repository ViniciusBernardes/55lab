import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import SmoothScroll from "smooth-scroll";
import { EditaisPage } from "./pages/EditaisPage";
import { EditalDetailPage } from "./pages/EditalDetailPage";
import { LandingPage } from "./pages/LandingPage";
import { OpenAiCredentialsPage } from "./pages/OpenAiCredentialsPage";

new SmoothScroll('a[href*="#"]', {
  speed: 800,
  speedAsDuration: true,
});

const App = () => {
  return (
    <BrowserRouter>
      <div className="lab-site">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/editais" element={<EditaisPage />} />
          <Route path="/editais/credenciais" element={<OpenAiCredentialsPage />} />
          <Route path="/editais/:id" element={<EditalDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
