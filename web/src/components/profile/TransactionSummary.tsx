import type { Session } from "../../types";
import { CHAIN_CONFIG } from "../../config/constants";

interface TransactionSummaryProps {
  topics: Set<string>;
  selectedSessions: Session[];
  tripleCount: number;
}

export function TransactionSummary({
  topics,
  selectedSessions,
  tripleCount,
}: TransactionSummaryProps) {
  return (
    <section className="profile-section">
      <h2 className="profile-section-title">On-chain transaction</h2>
      <p className="tx-desc">
        This will create triples on the Intuition knowledge graph via the Sofia proxy. Each triple includes a deposit into its vault.
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
            <div
              className="tx-summary-header"
              style={{ marginTop: topics.size > 0 ? "0.75rem" : 0 }}
            >
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
          <span>Intuition (Chain {CHAIN_CONFIG.CHAIN_ID})</span>
        </div>
        <div className="tx-summary-row tx-summary-info">
          <span>Cost</span>
          <span>tripleCost + deposit + Sofia fees per triple</span>
        </div>
        <div className="tx-summary-row tx-summary-info">
          <span>Proxy</span>
          <span className="tx-proxy-address">{CHAIN_CONFIG.SOFIA_PROXY}</span>
        </div>
      </div>
    </section>
  );
}
