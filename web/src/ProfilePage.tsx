import { useMemo } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { explorerTxUrl, intuitionProfileUrl, getTypeCssColor } from "./config/constants";
import { formatDateShort } from "./utils/date.utils";
import { groupSessionsByDate } from "./utils/session.utils";
import { useWallet } from "./hooks/useWallet";
import { useInterestCounts } from "./hooks/useInterestCounts";

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
  const grouped = useMemo(() => groupSessionsByDate(selectedSessions), [selectedSessions]);

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
        <>
          {/* Header */}
          <div className="profile-header">
            <h1 className="profile-title">Your EthCC[9] Profile</h1>
            <p className="profile-subtitle">
              Here's what you're into. Ready to make it official on-chain?
            </p>
          </div>

          {/* Interests */}
          {topics.size > 0 && (
            <section className="profile-section">
              <h2 className="profile-section-title">
                Your interests ({topics.size})
              </h2>
              <div className="profile-topics">
                {[...topics].map((t) => (
                  <div key={t} className="profile-topic-row">
                    <span className="profile-topic-pill">{t}</span>
                    {interestCounts[t] !== undefined && interestCounts[t] > 0 && (
                      <span className="profile-topic-count">
                        {interestCounts[t]} person{interestCounts[t] !== 1 ? "s" : ""} also interested
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Selected sessions */}
          <section className="profile-section">
            <h2 className="profile-section-title">
              Your sessions ({selectedSessions.length})
            </h2>
            {grouped.map(([date, list]) => (
              <div key={date} className="profile-day">
                <h3 className="profile-day-label">{formatDateShort(date)}</h3>
                <div className="profile-session-list">
                  {list.map((s) => (
                    <div
                      key={s.id}
                      className="profile-session"
                      style={{
                        borderLeftColor: getTypeCssColor(s.type),
                      }}
                    >
                      <div className="profile-session-time">
                        {s.startTime} – {s.endTime}
                      </div>
                      <div className="profile-session-info">
                        <span className="profile-session-title">
                          {s.title}
                        </span>
                        <span className="profile-session-meta">
                          {s.type} &middot; {s.track}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* Transaction summary */}
          <section className="profile-section">
            <h2 className="profile-section-title">On-chain transaction</h2>
            <p className="tx-desc">
              This will create triples on the Intuition knowledge graph (Chain ID 1155). Each triple links your wallet to your interests and sessions.
            </p>
            <div className="tx-summary">
              {topics.size > 0 && (
                <>
                  <div className="tx-summary-header">
                    You &rarr; are interested by &rarr; Topic
                  </div>
                  {[...topics].map((t) => (
                    <div key={t} className="tx-summary-row tx-triple-row">
                      <span className="tx-triple-label">{t}</span>
                      <span className="tx-triple-type">interest</span>
                    </div>
                  ))}
                </>
              )}
              {selectedSessions.length > 0 && (
                <>
                  <div className="tx-summary-header" style={{ marginTop: topics.size > 0 ? "0.75rem" : 0 }}>
                    You &rarr; attending &rarr; Session
                  </div>
                  {selectedSessions.map((s) => (
                    <div key={s.id} className="tx-summary-row tx-triple-row">
                      <span className="tx-triple-label">{s.title}</span>
                      <span className="tx-triple-type">{s.type}</span>
                    </div>
                  ))}
                </>
              )}
              <div className="tx-summary-row tx-summary-total">
                <span>Total triples to create</span>
                <span>{tripleCount}</span>
              </div>
              <div className="tx-summary-row tx-summary-info">
                <span>Network</span>
                <span>Intuition (Chain 1155)</span>
              </div>
              <div className="tx-summary-row tx-summary-info">
                <span>Cost per triple</span>
                <span>tripleCost in $TRUST</span>
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="profile-cta">
            <button
              className="profile-create-btn"
              onClick={() => setStep("wallet")}
            >
              Get Trust Token
            </button>
          </div>
        </>
      )}

      {(step === "wallet" || step === "connected" || step === "signing") && (
        <div className="wallet-page">
          <div className="profile-header">
            <h1 className="profile-title">
              {walletAddress ? "Get $TRUST tokens" : "Connect your wallet"}
            </h1>
            <p className="profile-subtitle">
              {walletAddress
                ? "Ask someone to scan your QR code and send you $TRUST to pay for the on-chain transaction."
                : "Connect your wallet to publish your profile on Intuition."
              }
            </p>
          </div>

          {/* QR Code — only when connected and no $TRUST yet */}
          {!walletAddress && (
            <div className="qr-container">
              <div className="qr-wrapper qr-disabled">
                <QRCodeSVG
                  value="0x0000000000000000000000000000000000000000"
                  size={200}
                  bgColor="transparent"
                  fgColor="#4a5568"
                  level="M"
                />
              </div>
              <p className="qr-label">Connect your wallet to receive $TRUST</p>
            </div>
          )}

          {walletAddress && trustBalance !== null && parseFloat(trustBalance) === 0 && (
            <div className="qr-container">
              <div className="qr-wrapper">
                <QRCodeSVG
                  value={walletAddress}
                  size={200}
                  bgColor="transparent"
                  fgColor="#ffffff"
                  level="M"
                />
              </div>
              <p className="qr-label">Scan to send $TRUST to your wallet</p>
              <p className="qr-address">{walletAddress}</p>
              <p className="qr-waiting">Waiting for $TRUST...</p>
            </div>
          )}

          {walletAddress && trustBalance !== null && parseFloat(trustBalance) > 0 && (
            <div className="trust-received">
              <div className="trust-received-check">&#10003;</div>
              <p className="trust-received-label">
                $TRUST received!
              </p>
              <p className="trust-received-amount">
                {parseFloat(trustBalance).toFixed(4)} $TRUST
              </p>
            </div>
          )}

          {txError && (
            <div className="tx-error">
              {txError}
            </div>
          )}

          <div className="profile-cta profile-cta-stack">
            {!walletAddress && (
              <>
                <button
                  className="profile-create-btn wallet-connect-btn"
                  disabled={!!txStatus}
                  onClick={handleConnect}
                >
                  {txStatus || "Connect Wallet"}
                </button>
                <button
                  className="profile-secondary-btn"
                  onClick={() => addIntuitionChain().catch(() => {})}
                >
                  Add Intuition Chain
                </button>
              </>
            )}
            {walletAddress && (
              <button
                className="profile-create-btn"
                disabled={step === "signing"}
                onClick={handleCreate}
              >
                {step === "signing" ? txStatus : `Create my profile (${tripleCount} triples)`}
              </button>
            )}
            {step !== "signing" && (
              <button
                className="profile-back-btn"
                onClick={() => setStep("recap")}
              >
                &larr; Back to recap
              </button>
            )}
          </div>
        </div>
      )}

      {step === "created" && (
        <div className="profile-created">
          <div className="profile-check">&#10003;</div>
          <h1 className="profile-title">
            You're on-chain!
          </h1>
          <p className="profile-subtitle">
            Your profile is now live on Intuition with{" "}
            <strong>{topics.size}</strong> interest
            {topics.size !== 1 ? "s" : ""} and{" "}
            <strong>{selectedSessions.length}</strong> session
            {selectedSessions.length !== 1 ? "s" : ""}.
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
            <h2 className="profile-section-title">
              People who share your vibe
            </h2>
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
      )}
    </div>
  );
}
