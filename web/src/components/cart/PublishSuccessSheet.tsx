import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { C } from "../../config/theme";
import { explorerTxUrl, intuitionProfileUrl } from "../../config/constants";
import { useVibeMatches } from "../../hooks/useVibeMatches";
import { UserLabel } from "../ui/UserLabel";
import styles from "./PublishSuccessSheet.module.css";

interface PublishSuccessSheetProps {
  // Data about what was published
  interestCount: number;
  sessionCount: number;
  voteCount: number;
  ratingCount: number;
  followCount: number;

  // Blockchain data
  txHash: string;
  walletAddress: string;
  userAtomId: string;

  // For vibe matching
  topics: Set<string>;
  sessionIds: string[];

  // Cost breakdown
  totalCost?: string; // "2.456 TRUST"
  depositsAmount?: string; // "1.200 TRUST"
  multiVaultFees?: string; // "0.800 TRUST"
  sofiaFees?: string; // "0.456 TRUST"

  // Callbacks
  onClose: () => void;
}

export function PublishSuccessSheet({
  interestCount,
  sessionCount,
  voteCount,
  ratingCount,
  followCount,
  txHash,
  walletAddress,
  userAtomId,
  topics,
  sessionIds,
  totalCost,
  depositsAmount,
  multiVaultFees,
  sofiaFees,
  onClose,
}: PublishSuccessSheetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showMatches, setShowMatches] = useState(false);

  // Don't fetch matches until user clicks "Find Your Tribe"
  const emptyTopics = useMemo(() => new Set<string>(), []);
  const emptySessions = useMemo(() => [], []);

  const { matches, loading: vibeLoading } = useVibeMatches(
    showMatches ? topics : emptyTopics,
    showMatches ? sessionIds : emptySessions,
    walletAddress,
    undefined,
    showMatches ? 1 : 0
  );

  // Trigger haptic feedback if available
  const haptic = () => {
    if ("vibrate" in navigator) {
      navigator.vibrate(10);
    }
  };

  // Animation on mount
  useEffect(() => {
    haptic();
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  // Find matches functionality
  const handleFindMatches = () => {
    haptic();
    setShowMatches(true);
  };

  return (
    <div className={`${styles.overlay} ${isVisible ? styles.visible : ""}`} onClick={onClose}>
      <div
        className={`${styles.sheet} ${isVisible ? styles.sheetVisible : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar for visual feedback */}
        <div className={styles.handleBar} />

        {/* Success Header */}
        <div className={styles.header}>
          <div className={styles.successIcon}>✓</div>
          <h2 className={styles.title}>Published successfully!</h2>
          <p className={styles.subtitle}>
            Your profile is now on the blockchain
          </p>
        </div>

        {/* Scroll content */}
        <div className={styles.content}>

          {/* Summary Cards */}
          <div className={styles.summaryGrid}>
            {interestCount > 0 && (
              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon} style={{ background: C.primaryLight, color: C.primary }}>
                  💜
                </div>
                <div className={styles.summaryCount}>{interestCount}</div>
                <div className={styles.summaryLabel}>
                  {interestCount === 1 ? "Interest" : "Interests"}
                </div>
              </div>
            )}

            {sessionCount > 0 && (
              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon} style={{ background: C.flatLight, color: C.flat }}>
                  📅
                </div>
                <div className={styles.summaryCount}>{sessionCount}</div>
                <div className={styles.summaryLabel}>
                  {sessionCount === 1 ? "Session" : "Sessions"}
                </div>
              </div>
            )}

            {voteCount > 0 && (
              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon} style={{ background: C.successLight, color: C.success }}>
                  🗳️
                </div>
                <div className={styles.summaryCount}>{voteCount}</div>
                <div className={styles.summaryLabel}>
                  {voteCount === 1 ? "Vote" : "Votes"}
                </div>
              </div>
            )}

            {ratingCount > 0 && (
              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon} style={{ background: "rgba(255, 215, 0, 0.15)", color: C.gold }}>
                  ⭐
                </div>
                <div className={styles.summaryCount}>{ratingCount}</div>
                <div className={styles.summaryLabel}>
                  {ratingCount === 1 ? "Rating" : "Ratings"}
                </div>
              </div>
            )}

            {followCount > 0 && (
              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon} style={{ background: "rgba(100, 181, 246, 0.15)", color: "#64B5F6" }}>
                  👤
                </div>
                <div className={styles.summaryCount}>{followCount}</div>
                <div className={styles.summaryLabel}>
                  {followCount === 1 ? "Follow" : "Follows"}
                </div>
              </div>
            )}
          </div>

          {/* Cost breakdown (collapsible) */}
          {totalCost && (
            <div className={styles.section}>
              <button
                className={styles.detailsToggle}
                onClick={() => {
                  haptic();
                  setShowDetails(!showDetails);
                }}
              >
                <span className={styles.detailsToggleLabel}>
                  💰 Total cost: <strong>{totalCost}</strong>
                </span>
                <span className={styles.detailsToggleIcon}>
                  {showDetails ? "▼" : "▶"}
                </span>
              </button>

              {showDetails && (
                <div className={styles.costBreakdown}>
                  {depositsAmount && (
                    <div className={styles.costRow}>
                      <span className={styles.costLabel}>
                        Your deposits
                        <span className={styles.costHint}>(recoverable)</span>
                      </span>
                      <span className={styles.costValue} style={{ color: C.trust }}>
                        {depositsAmount}
                      </span>
                    </div>
                  )}
                  {multiVaultFees && (
                    <div className={styles.costRow}>
                      <span className={styles.costLabel}>MultiVault fees</span>
                      <span className={styles.costValue}>{multiVaultFees}</span>
                    </div>
                  )}
                  {sofiaFees && (
                    <div className={styles.costRow}>
                      <span className={styles.costLabel}>Sofia fees</span>
                      <span className={styles.costValue}>{sofiaFees}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Links */}
          <div className={styles.linkSection}>
            {txHash && (
              <a
                href={explorerTxUrl(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
                onClick={haptic}
              >
                <span className={styles.linkIcon}>🔗</span>
                <span className={styles.linkText}>View transaction</span>
                <span className={styles.linkArrow}>→</span>
              </a>
            )}

            {userAtomId && (
              <a
                href={intuitionProfileUrl(userAtomId)}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
                onClick={haptic}
              >
                <span className={styles.linkIcon}>📊</span>
                <span className={styles.linkText}>View on Intuition</span>
                <span className={styles.linkArrow}>→</span>
              </a>
            )}
          </div>

          {/* Vibe Matches - Only show after clicking Find Your Tribe */}
          {showMatches && (
            <>
              {vibeLoading && (
                <div className={styles.section}>
                  <div className={styles.loadingBox}>
                    <div className={styles.loadingSpinner}></div>
                    <div className={styles.loadingText}>
                      Finding people with your vibes...
                    </div>
                  </div>
                </div>
              )}

              {!vibeLoading && matches.length > 0 && (
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <span className={styles.sectionIcon}>👥</span>
                    <h3 className={styles.sectionTitle}>
                      {matches.length} {matches.length > 1 ? "people" : "person"} found!
                    </h3>
                  </div>
                  <div className={styles.vibeList}>
                    {matches.slice(0, 6).map((match) => (
                      <a
                        key={match.subjectTermId}
                        href={intuitionProfileUrl(match.subjectTermId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.vibeCard}
                        onClick={haptic}
                      >
                        <div className={styles.vibeAvatar}>
                          {match.label.slice(2, 4).toUpperCase()}
                        </div>
                        <div className={styles.vibeInfo}>
                          <UserLabel address={match.label} style={{ fontSize: 12, fontWeight: 600 }} />
                          <div className={styles.vibeShared}>
                            {match.matchScore}% match score
                          </div>
                          {match.sharedTopics.length > 0 && (
                            <div className={styles.vibeTopics}>
                              {match.sharedTopics.slice(0, 2).join(", ")}
                              {match.sharedTopics.length > 2 && ` +${match.sharedTopics.length - 2}`}
                            </div>
                          )}
                        </div>
                        <span className={styles.vibeArrow}>→</span>
                      </a>
                    ))}
                  </div>
                  {matches.length > 6 && (
                    <Link to="/home" className={styles.viewAllLink} onClick={haptic}>
                      View all {matches.length} matches →
                    </Link>
                  )}
                </div>
              )}

              {!vibeLoading && matches.length === 0 && (
                <div className={styles.section}>
                  <div className={styles.emptyBox}>
                    <div className={styles.emptyIcon}>⏳</div>
                    <div className={styles.emptyTitle}>Indexing in progress...</div>
                    <div className={styles.emptyText}>
                      Your data has just been published! Indexing may take a few seconds.
                      Return to the home page and click on "Nearby Vibes" in 30 seconds.
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Action buttons */}
          <div className={styles.actions}>
            {!showMatches ? (
              <button
                className={styles.primaryBtn}
                onClick={handleFindMatches}
              >
                👥 Find Your Tribe
              </button>
            ) : (
              <Link
                to="/home"
                className={styles.primaryBtn}
                onClick={haptic}
              >
                🏠 View all matches
              </Link>
            )}

            <div className={styles.actionGrid}>
              <Link
                to="/vote"
                className={styles.secondaryBtn}
                onClick={haptic}
              >
                🗳️ Votes
              </Link>
              <Link
                to="/"
                className={styles.secondaryBtn}
                onClick={haptic}
              >
                📅 Agenda
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
