import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { EmbeddedWalletProvider } from "./contexts/EmbeddedWalletContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import App from "./App";

// Initialize AppKit (multi-wallet: MetaMask, WalletConnect, Coinbase)
import "./config/appkit";

// Pages
import OnboardingPage from "./pages/OnboardingPage";
import HomePage from "./pages/HomePage";
import AgendaPage from "./pages/AgendaPage";
import CartPage from "./pages/CartPage";
import VotePage from "./pages/VotePage";
import ProfilePage from "./pages/ProfilePage";
import SessionDetailPage from "./pages/SessionDetailPage";
import { SpeakerPage } from "./pages/SpeakerPage";
import SendPage from "./pages/SendPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import InvitePage from "./pages/InvitePage";
import VibeProfilePage from "./pages/VibeProfilePage";
import VibesListPage from "./pages/VibesListPage";
import SettingsPage from "./pages/SettingsPage";
import TopicDetailPage from "./pages/TopicDetailPage";
import RateSessionPage from "./pages/RateSessionPage";
import NotificationsPage from "./pages/NotificationsPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <EmbeddedWalletProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<App />}>
            {/* Onboarding */}
            <Route index element={<OnboardingPage />} />

            {/* Main tabs - Protected */}
            <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/agenda" element={<ProtectedRoute><AgendaPage /></ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
            <Route path="/vote" element={<ProtectedRoute><VotePage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

            {/* Detail pages - Protected */}
            <Route path="/session/:id" element={<ProtectedRoute><SessionDetailPage /></ProtectedRoute>} />
            <Route path="/rate/:id" element={<ProtectedRoute><RateSessionPage /></ProtectedRoute>} />
            <Route path="/topic/:id" element={<ProtectedRoute><TopicDetailPage /></ProtectedRoute>} />
            <Route path="/speaker/:slug" element={<ProtectedRoute><SpeakerPage /></ProtectedRoute>} />

            {/* Utility pages - Protected */}
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/send" element={<ProtectedRoute><SendPage /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
            <Route path="/invite" element={<ProtectedRoute><InvitePage /></ProtectedRoute>} />
            <Route path="/vibes" element={<ProtectedRoute><VibesListPage /></ProtectedRoute>} />
            <Route path="/vibe/:index" element={<ProtectedRoute><VibeProfilePage /></ProtectedRoute>} />
            <Route path="/vibe-profile/:address" element={<ProtectedRoute><VibeProfilePage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </EmbeddedWalletProvider>
    </ErrorBoundary>
  </StrictMode>
);
