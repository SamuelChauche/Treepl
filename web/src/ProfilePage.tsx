import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { sessions } from "./data";
import {
  connectWallet,
  addIntuitionChain,
  ensureUserAtom,
  buildProfileTriples,
  createProfileTriples,
  TRACK_ATOM_IDS,
  PREDICATES,
} from "./intuition";
import type { Session } from "./types";

const GQL_URL = "https://mainnet.intuition.sh/v1/graphql";

const CART_KEY = "ethcc-cart";
const TOPICS_KEY = "ethcc-topics";

function loadSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

const TYPE_BORDER: Record<string, string> = {
  Talk: "var(--orange)",
  Workshop: "var(--yellow)",
  Panel: "var(--blue)",
  Demo: "var(--lime)",
};

type Step = "recap" | "wallet" | "connected" | "signing" | "created";

export function ProfilePage() {
  const [step, setStep] = useState<Step>("recap");
  const [txStatus, setTxStatus] = useState("");
  const [txHash, setTxHash] = useState("");
  const [txError, setTxError] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [walletState, setWalletState] = useState<{ contract: any; ethers: any; provider: any } | null>(null);
  const [trustBalance, setTrustBalance] = useState<string | null>(null); // null = not checked yet

  const cart = useMemo(() => loadSet(CART_KEY), []);
  const topics = useMemo(() => loadSet(TOPICS_KEY), []);

  const selectedSessions = useMemo(
    () => sessions.filter((s) => cart.has(s.id)),
    [cart]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Session[]>();
    for (const s of selectedSessions) {
      const list = map.get(s.date) ?? [];
      list.push(s);
      map.set(s.date, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [selectedSessions]);

  const tripleCount = topics.size + selectedSessions.length;

  // Fetch "also interested" counts from Intuition GraphQL
  const [interestCounts, setInterestCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    if (topics.size === 0) return;
    const trackIds = [...topics]
      .map((t) => TRACK_ATOM_IDS[t])
      .filter(Boolean);
    if (trackIds.length === 0) return;

    const query = `{
      ${trackIds.map((id, i) => `
        t${i}: triples_aggregate(where: {
          predicate: { term_id: { _eq: "${PREDICATES["are interested by"]}" } }
          object: { term_id: { _eq: "${id}" } }
        }) { aggregate { count } }
      `).join("")}
    }`;

    fetch(GQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    })
      .then((r) => r.json())
      .then((res) => {
        const counts: Record<string, number> = {};
        const topicList = [...topics];
        trackIds.forEach((id, i) => {
          const c = res.data?.[`t${i}`]?.aggregate?.count ?? 0;
          // find the topic name for this trackId
          const name = topicList.find((t) => TRACK_ATOM_IDS[t] === id);
          if (name) counts[name] = c;
        });
        setInterestCounts(counts);
      })
      .catch(() => {});
  }, [topics]);

  async function handleConnect() {
    setTxError("");
    setTxStatus("Connecting wallet...");

    try {
      const { contract, address, ethers, provider } = await connectWallet();
      setWalletAddress(address);
      setWalletState({ contract, ethers, provider });
      setTxStatus("");
      setStep("connected");

      // Check initial balance
      const bal = await provider.getBalance(address);
      setTrustBalance(ethers.formatEther(bal));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setTxError(msg);
      setTxStatus("");
    }
  }

  // Poll balance when connected and balance is 0
  useEffect(() => {
    if (!walletState || !walletAddress || trustBalance === null) return;
    if (parseFloat(trustBalance) > 0) return;

    const interval = setInterval(async () => {
      try {
        const bal = await walletState.provider.getBalance(walletAddress);
        const formatted = walletState.ethers.formatEther(bal);
        setTrustBalance(formatted);
        if (parseFloat(formatted) > 0) {
          clearInterval(interval);
        }
      } catch {}
    }, 5000);

    return () => clearInterval(interval);
  }, [walletState, walletAddress, trustBalance]);

  async function handleCreate() {
    if (!walletState) return;
    setTxError("");
    setStep("signing");

    try {
      const { contract, ethers } = walletState;

      setTxStatus("Checking your atom on Intuition...");
      const userAtomId = await ensureUserAtom(contract, walletAddress, ethers);

      const triples = buildProfileTriples(
        userAtomId,
        [...topics],
        [...cart]
      );

      if (triples.length === 0) {
        setTxError("No triples to create.");
        setStep("connected");
        return;
      }

      setTxStatus(
        `Creating ${triples.length} triples... Confirm in your wallet`
      );
      const result = await createProfileTriples(contract, triples);

      setTxHash(result.hash);
      setStep("created");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setTxError(msg);
      setStep("connected");
    }
  }

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
                <h3 className="profile-day-label">{formatDate(date)}</h3>
                <div className="profile-session-list">
                  {list.map((s) => (
                    <div
                      key={s.id}
                      className="profile-session"
                      style={{
                        borderLeftColor:
                          TYPE_BORDER[s.type] ?? "var(--teal)",
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
              href={`https://explorer.intuition.systems/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tx-link"
            >
              View transaction &rarr;
            </a>
          )}

          {walletAddress && (
            <a
              href={`https://portal.intuition.systems/app/profile/${walletAddress}`}
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
