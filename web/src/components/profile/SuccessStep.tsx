import { useMemo } from "react";
import { Link } from "react-router-dom";
import { explorerTxUrl, intuitionProfileUrl } from "../../config/constants";
import { useVibeMatches } from "../../hooks/useVibeMatches";
import { sessions } from "../../data";

interface SuccessStepProps {
  topicCount: number;
  sessionCount: number;
  txHash: string;
  walletAddress: string;
  userAtomId: string;
  topics: Set<string>;
  sessionIds: string[];
}

export function SuccessStep({
  topicCount,
  sessionCount,
  txHash,
  walletAddress,
  userAtomId,
  topics,
  sessionIds,
}: SuccessStepProps) {
  const { matches, loading } = useVibeMatches(topics, sessionIds, walletAddress);

  const sessionTitleMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of sessions) map.set(s.id, s.title);
    return map;
  }, []);

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

      {userAtomId && (
        <a
          href={intuitionProfileUrl(userAtomId)}
          target="_blank"
          rel="noopener noreferrer"
          className="tx-link"
          style={{ marginTop: "0.5rem" }}
        >
          View your Intuition profile &rarr;
        </a>
      )}

      {/* Matching interests */}
      <section className="profile-section" style={{ marginTop: "2.5rem" }}>
        <h2 className="profile-section-title">People who share your vibe</h2>
        <p className="profile-match-hint">
          Other attendees interested in your topics will appear here.
          Exchange links, plan meetups, build your network.
        </p>

        {loading && (
          <div className="profile-match-placeholder">
            <span>Searching for your vibe tribe...</span>
          </div>
        )}

        {!loading && matches.length === 0 && (
          <div className="profile-match-placeholder">
            <span>No matches yet — you're an early adopter! Share EthCC to find your tribe.</span>
          </div>
        )}

        {!loading && matches.length > 0 && (
          <div className="vibe-match-list">
            {matches.map((m) => (
              <div key={m.subjectTermId} className="vibe-match-card">
                <div className="vibe-match-header">
                  <span className="vibe-match-address">
                    {m.label.slice(0, 6)}...{m.label.slice(-4)}
                  </span>
                  <span className="vibe-match-score">
                    {m.matchScore} shared{" "}
                    {m.matchScore === 1 ? "interest" : "interests"}
                  </span>
                </div>
                <div className="vibe-match-pills">
                  {m.sharedTopics.map((t) => (
                    <span key={t} className="vibe-match-pill vibe-pill-topic">
                      {t}
                    </span>
                  ))}
                  {m.sharedSessions.map((sid) => (
                    <span key={sid} className="vibe-match-pill vibe-pill-session">
                      {sessionTitleMap.get(sid) ?? sid}
                    </span>
                  ))}
                </div>
                <a
                  href={intuitionProfileUrl(m.subjectTermId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="vibe-match-link"
                >
                  View profile &rarr;
                </a>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Big CTA → Vote page */}
      <div className="profile-cta-bridge">
        <Link to="/vote" className="bridge-cta-btn">
          Stay connected with participants
        </Link>
        <p className="bridge-cta-sub">
          Trade convictions on web3 topics, find people who think like you, and build your on-chain reputation.
        </p>
      </div>

      <div className="profile-cta">
        <Link to="/" className="profile-back-btn">
          Back to agenda
        </Link>
      </div>
    </div>
  );
}
