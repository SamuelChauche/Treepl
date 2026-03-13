import { Link } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { useInterestCounts } from "../hooks/useInterestCounts";
import { RecapStep } from "../components/profile/RecapStep";
import { WalletStep } from "../components/profile/WalletStep";
import { SuccessStep } from "../components/profile/SuccessStep";

export function ProfilePage() {
  const {
    step,
    setStep,
    txStatus,
    txHash,
    txError,
    walletAddress,
    trustBalance,
    cart,
    topics,
    selectedSessions,
    tripleCount,
    handleConnect,
    handleCreate,
    addIntuitionChain,
  } = useWallet();

  const interestCounts = useInterestCounts(topics);

  if (cart.size === 0) {
    return (
      <div className="profile-page">
        <Link to="/" className="back-link">
          &larr; Back to agenda
        </Link>
        <p className="empty-state">No sessions selected yet.</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Link to="/" className="back-link">
        &larr; Back to agenda
      </Link>

      {step === "recap" && (
        <RecapStep
          topics={topics}
          selectedSessions={selectedSessions}
          tripleCount={tripleCount}
          interestCounts={interestCounts}
          onNext={() => setStep("wallet")}
        />
      )}

      {(step === "wallet" || step === "connected" || step === "signing") && (
        <WalletStep
          step={step}
          walletAddress={walletAddress}
          trustBalance={trustBalance}
          txStatus={txStatus}
          txError={txError}
          tripleCount={tripleCount}
          onConnect={handleConnect}
          onCreate={handleCreate}
          onAddChain={() => addIntuitionChain().catch(() => {})}
          onBack={() => setStep("recap")}
        />
      )}

      {step === "created" && (
        <SuccessStep
          topicCount={topics.size}
          sessionCount={selectedSessions.length}
          txHash={txHash}
          walletAddress={walletAddress}
        />
      )}
    </div>
  );
}
