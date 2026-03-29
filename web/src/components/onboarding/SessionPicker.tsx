import { useMemo } from "react";
import { C, getTrackStyle } from "../../config/theme";
import { sessions } from "../../data";
import { groupSessionsByDate } from "../../utils/session.utils";
import { Ic } from "../ui/Icons";
import styles from "./SessionPicker.module.css";
import shared from "../../styles/shared.module.css";

const DAY_LABELS: Record<string, string> = {
  "2026-03-30": "Mon 30 March",
  "2026-03-31": "Tue 31 March",
  "2026-04-01": "Wed 1 April",
  "2026-04-02": "Thu 2 April",
};

function formatDayLabel(date: string): string {
  return DAY_LABELS[date] ?? date;
}

interface Props {
  selectedTracks: Set<string>;
  selectedSessions: Set<string>;
  onToggleSession: (id: string) => void;
  onSetSessions: (ids: Set<string>) => void;
  onBack: () => void;
  onNext: () => void;
}

export function SessionPicker({ selectedTracks, selectedSessions, onToggleSession, onSetSessions, onBack, onNext }: Props) {
  const matchingSessions = useMemo(
    () => sessions.filter((s) => selectedTracks.has(s.track)),
    [selectedTracks],
  );

  const groupedByDay = useMemo(
    () => groupSessionsByDate(matchingSessions),
    [matchingSessions],
  );

  const overHalf = matchingSessions.length > 0 && selectedSessions.size > Math.floor(matchingSessions.length / 2);

  const allSelected = matchingSessions.length > 0 && matchingSessions.every((s) => selectedSessions.has(s.id));

  const handleSelectAll = () => {
    if (allSelected) {
      const matchingIds = new Set(matchingSessions.map((s) => s.id));
      const next = new Set([...selectedSessions].filter((id) => !matchingIds.has(id)));
      onSetSessions(next);
    } else {
      const next = new Set(selectedSessions);
      for (const s of matchingSessions) next.add(s.id);
      onSetSessions(next);
    }
  };

  return (
    <div className={shared.page}>
      <div className={styles.header}>
        <div className={shared.progressBar}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={i <= 1 ? shared.progressDotActive : shared.progressDot} />
          ))}
        </div>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>Add sessions to cart</h2>
          {matchingSessions.length > 0 && (
            <button className={styles.selectAllBtn} onClick={handleSelectAll}>
              {allSelected ? "Deselect all" : "Select all"}
            </button>
          )}
        </div>
        <p className={styles.subtitle}>Select sessions you want to attend.</p>
      </div>

      <div className={styles.scrollArea}>
        {overHalf && (
          <div className={styles.warningBanner}>
            <strong>Heads up</strong> — you selected {selectedSessions.size} out of {matchingSessions.length} sessions. Each one creates an on-chain triple (~0.3 TRUST). That adds up quickly!
          </div>
        )}
        <div className={styles.sessionList}>
          {matchingSessions.length === 0 && (
            <p className={styles.emptyMsg}>No sessions match your selected tracks.</p>
          )}
          {groupedByDay.map(([date, daySessions]) => (
            <div key={date}>
              <div className={styles.dayHeader}>
                <span className={styles.dayLabel}>{formatDayLabel(date)}</span>
                <span className={styles.dayCount}>{daySessions.length} sessions</span>
              </div>
              {daySessions.map((s) => {
                const ts = getTrackStyle(s.track);
                const checked = selectedSessions.has(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => onToggleSession(s.id)}
                    className={styles.sessionCard}
                    style={{
                      background: checked ? `${ts.color}15` : C.surfaceGray,
                      borderColor: checked ? ts.color : C.border,
                    }}
                  >
                    <div className={styles.accentBar} style={{ background: ts.color }} />
                    <div className={styles.iconBox} style={{ background: `${ts.color}25` }}>
                      {ts.icon}
                    </div>
                    <div className={styles.sessionInfo}>
                      <div className={styles.sessionTitle}>{s.title}</div>
                      <div className={styles.sessionMeta}>
                        {s.speakers.length > 0 ? s.speakers[0].name : "TBA"} &middot; {s.startTime}
                      </div>
                      <span className={styles.sessionTrack} style={{ color: ts.color }}>
                        {s.track}
                      </span>
                    </div>
                    <div
                      className={styles.checkbox}
                      style={{
                        border: `2px solid ${checked ? ts.color : C.textTertiary}`,
                        background: checked ? ts.color : "transparent",
                      }}
                    >
                      {checked && <Ic.Check s={14} c={C.white} />}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.bottomBar}>
        <div className={styles.btnRow}>
          <button className={styles.backBtn} onClick={onBack}>Back</button>
          <button className={styles.nextBtn} onClick={onNext}>
            {selectedSessions.size > 0 ? `Review \u00B7 ${selectedSessions.size} selected` : "Skip"}
          </button>
        </div>
      </div>
    </div>
  );
}
