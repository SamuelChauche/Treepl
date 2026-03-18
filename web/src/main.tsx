import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
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
import BuyTrustPage from "./pages/BuyTrustPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import InvitePage from "./pages/InvitePage";
import VibeProfilePage from "./pages/VibeProfilePage";
import VibesListPage from "./pages/VibesListPage";
import SettingsPage from "./pages/SettingsPage";
import TopicDetailPage from "./pages/TopicDetailPage";
import RateSessionPage from "./pages/RateSessionPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename="/Treepl">
        <Routes>
          <Route element={<App />}>
            {/* Onboarding */}
            <Route index element={<OnboardingPage />} />

            {/* Main tabs */}
            <Route path="/home" element={<HomePage />} />
            <Route path="/agenda" element={<AgendaPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/vote" element={<VotePage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Detail pages */}
            <Route path="/session/:id" element={<SessionDetailPage />} />
            <Route path="/rate/:id" element={<RateSessionPage />} />
            <Route path="/topic/:id" element={<TopicDetailPage />} />
            <Route path="/speaker/:slug" element={<SpeakerPage />} />

            {/* Utility pages */}
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/send" element={<SendPage />} />
            <Route path="/buy" element={<BuyTrustPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/invite" element={<InvitePage />} />
            <Route path="/vibes" element={<VibesListPage />} />
            <Route path="/vibe/:index" element={<VibeProfilePage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
