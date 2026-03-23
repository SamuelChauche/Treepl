import { useMemo } from "react";
import { C, getTrackStyle } from "../../config/theme";
import { sessions } from "../../data";
import { Ic } from "../ui/Icons";
import styles from "./SessionPicker.module.css";
import shared from "../../styles/shared.module.css";

interface Props {
  selectedTracks: Set<string>;
  selectedSessions: Set<string>;
  onToggleSession: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function SessionPicker({ selectedTracks, selectedSessions, onToggleSession, onBack, onNext }: Props) {
  const matchingSessions = useMemo(
    () => sessions.filter((s) => selectedTracks.has(s.track)).slice(0, 20),
    [selectedTracks],
  );

  const allSelected = matchingSessions.length > 0 && matchingSessions.every((s) => selectedSessions.has(s.id));

  const handleSelectAll = () => {
    for (const s of matchingSessions) {
      if (allSelected) {
        if (selectedSessions.has(s.id)) onToggleSession(s.id);
      } else {
        if (!selectedSessions.has(s.id)) onToggleSession(s.id);
      }
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
        <div className={styles.sessionList}>
          {matchingSessions.length === 0 && (
            <p className={styles.emptyMsg}>No sessions match your selected tracks.</p>
          )}
          {matchingSessions.map((s) => {
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
      </div>

      <div className={styles.bottomBar}>
        <div className={styles.btnRow}>
          <button className={styles.backBtn} onClick={onBack}>Back</button>
          <button className={styles.nextBtn} onClick={onNext}>
            {selectedSessions.size > 0 ? `Review \u00B7 ${selectedSessions.size}` : "Skip"}
          </button>
        </div>
      </div>
    </div>
  );
}
