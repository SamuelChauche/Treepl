import { useMemo } from "react";
import { getTypeCssColor } from "../../config/constants";
import { formatDateShort } from "../../utils/date.utils";
import { groupSessionsByDate } from "../../utils/session.utils";
import { TransactionSummary } from "./TransactionSummary";
import type { Session } from "../../types";

interface RecapStepProps {
  topics: Set<string>;
  selectedSessions: Session[];
  tripleCount: number;
  interestCounts: Record<string, number>;
  onNext: () => void;
}

export function RecapStep({
  topics,
  selectedSessions,
  tripleCount,
  interestCounts,
  onNext,
}: RecapStepProps) {
  const grouped = useMemo(() => groupSessionsByDate(selectedSessions), [selectedSessions]);

  return (
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
                  style={{ borderLeftColor: getTypeCssColor(s.type) }}
                >
                  <div className="profile-session-time">
                    {s.startTime} – {s.endTime}
                  </div>
                  <div className="profile-session-info">
                    <span className="profile-session-title">{s.title}</span>
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

      <TransactionSummary
        topics={topics}
        selectedSessions={selectedSessions}
        tripleCount={tripleCount}
      />

      {/* CTA */}
      <div className="profile-cta">
        <button className="profile-create-btn" onClick={onNext}>
          Get Trust Token
        </button>
      </div>
    </>
  );
}
