import { useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { C, FONT } from "../config/theme";
import { SplashStep, SlideStep, InterestPicker, SessionPicker } from "../components/onboarding";
import { Step6ReviewPublish } from "../components/onboarding/Step6ReviewPublish";
import { Step7Success } from "../components/onboarding/Step7Success";
import { useOnboardingWallet } from "../hooks/useOnboardingWallet";
import { useOnboardingPublish } from "../hooks/useOnboardingPublish";
import { useVibeMatches } from "../hooks/useVibeMatches";
import { usePwaInstall } from "../hooks/usePwaInstall";
import { StorageService } from "../services/StorageService";
import { STORAGE_KEYS } from "../config/constants";

const page: CSSProperties = {
  flex: 1, display: "flex", flexDirection: "column",
  background: "transparent", color: C.textPrimary, fontFamily: FONT, overflow: "hidden",
};

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());

  const w = useOnboardingWallet();
  const { txState, txHash, publish } = useOnboardingPublish();
  const { canInstall, installed, promptInstall } = usePwaInstall();

  const walletState = w.computeWalletState(txState);

  // Vibe matches for step 7
  const { matches: vibeMatchesData, loading: vibeLoading } = useVibeMatches(
    selectedTracks, [...selectedSessions], w.effectiveAddress ?? "",
  );

  const toggleTrack = (name: string) => {
    setSelectedTracks((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const toggleSession = (id: string) => {
    setSelectedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handlePublish = () => {
    if (!w.effectiveWallet) return;
    publish(w.effectiveWallet, selectedTracks, selectedSessions, {
      setTxError: w.setTxError,
      setTxStatus: w.setTxStatus,
      refreshBalance: w.refreshEmbeddedBalance,
      onSuccess: () => setStep(7),
    });
  };

  const handleComplete = () => {
    StorageService.saveTopics(selectedTracks);
    // Sessions already in PUBLISHED_SESSIONS — don't add to cart
    localStorage.setItem(STORAGE_KEYS.ONBOARDED, "1");
    navigate("/home");
  };

  // Step 0: Splash
  if (step === 0) return <div style={page}><SplashStep onNext={() => setStep(1)} /></div>;

  // Steps 1-3: Slides
  if (step >= 1 && step <= 3) return <div style={page}><SlideStep slideIndex={step} onNext={() => setStep(step + 1)} /></div>;

  // Step 4: Interest picker
  if (step === 4) {
    return (
      <InterestPicker
        selectedTracks={selectedTracks}
        onToggleTrack={toggleTrack}
        onBack={() => setStep(3)}
        onNext={() => setStep(5)}
      />
    );
  }

  // Step 5: Session picker
  if (step === 5) {
    return (
      <SessionPicker
        selectedTracks={selectedTracks}
        selectedSessions={selectedSessions}
        onToggleSession={toggleSession}
        onBack={() => setStep(4)}
        onNext={() => setStep(6)}
      />
    );
  }

  // Step 6: Review & publish
  if (step === 6) {
    return (
      <div style={page}>
        <Step6ReviewPublish
          selectedTracks={selectedTracks}
          selectedSessions={selectedSessions}
          walletState={walletState}
          w={w}
          onBack={() => setStep(5)}
          onPublish={handlePublish}
        />
      </div>
    );
  }

  // Step 7: Success
  if (step === 7) {
    return (
      <div style={page}>
        <Step7Success
          selectedTracks={selectedTracks}
          txHash={txHash}
          vibeMatchesData={vibeMatchesData}
          vibeLoading={vibeLoading}
          canInstall={canInstall}
          installed={installed}
          promptInstall={promptInstall}
          onComplete={handleComplete}
        />
      </div>
    );
  }

  return null;
}
