import { Link } from "react-router-dom";
import { explorerTxUrl, intuitionProfileUrl } from "../../config/constants";

interface SuccessStepProps {
  topicCount: number;
  sessionCount: number;
  txHash: string;
  walletAddress: string;
}

export function SuccessStep({
  topicCount,
  sessionCount,
  txHash,
  walletAddress,
}: SuccessStepProps) {
  return (
    <div className="profile-created">
      <div className="profile-check">&#10003;</div>
      <h1 className="profile-title">You're on-chain!</h1>
      <p className="profile-subtitle">
        Your profile is now live on Intuition with{" "}
        <strong>{topicCount}</strong> interest
        {topicCount !== 1 ? "s" : ""} and{" "}
        <strong>{sessionCount}</strong> session
        {sessionCount !== 1 ? "s" : ""}.
      </p>

      {txHash && (
        <a
          href={explorerTxUrl(txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="tx-link"
        >
          View transaction &rarr;
        </a>
      )}

      {walletAddress && (
        <a
          href={intuitionProfileUrl(walletAddress)}
          target="_blank"
          rel="noopener noreferrer"
          className="tx-link"
          style={{ marginTop: "0.5rem" }}
        >
          View your Intuition profile &rarr;
        </a>
      )}

      {/* Matching interests teaser */}
      <section className="profile-section" style={{ marginTop: "2.5rem" }}>
        <h2 className="profile-section-title">People who share your vibe</h2>
        <p className="profile-match-hint">
          Other attendees interested in your topics will appear here.
          Exchange links, plan meetups, build your network.
        </p>
        <div className="profile-match-placeholder">
          <span>Coming soon...</span>
        </div>
      </section>

      <div className="profile-cta">
        <Link to="/" className="profile-back-btn">
          Back to agenda
        </Link>
      </div>
    </div>
  );
}
