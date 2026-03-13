import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import AgendaPage from "./pages/AgendaPage";
import { SpeakerPage } from "./pages/SpeakerPage";
import { ProfilePage } from "./pages/ProfilePage";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename="/Treepl">
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<AgendaPage />} />
          <Route path="/speaker/:slug" element={<SpeakerPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
