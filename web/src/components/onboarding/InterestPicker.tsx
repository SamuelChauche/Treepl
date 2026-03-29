import { useMemo } from "react";
import { C, getTrackStyle } from "../../config/theme";
import { trackNames, sessions } from "../../data";
import styles from "./InterestPicker.module.css";
import shared from "../../styles/shared.module.css";

interface Props {
  selectedTracks: Set<string>;
  onToggleTrack: (name: string) => void;
  onBack: () => void;
  onNext: () => void;
}

const MAX_TRACKS = 3;

export function InterestPicker({ selectedTracks, onToggleTrack, onBack, onNext }: Props) {
  // Only show tracks that have at least 1 session (exclude empty side-event-only tracks)
  const visibleTracks = useMemo(
    () => trackNames.filter((t) => sessions.some((s) => s.track === t)),
    [],
  );

  const atLimit = selectedTracks.size >= MAX_TRACKS;

  return (
    <div className={shared.page}>
      <div className={styles.header}>
        <div className={shared.progressBar}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={i === 0 ? shared.progressDotActive : shared.progressDot} />
          ))}
        </div>
        <h2 className={styles.title}>Choose your interests</h2>
        <p className={styles.subtitle}>
          Pick up to {MAX_TRACKS} tracks — published on Intuition Protocol.
        </p>
      </div>

      <div className={styles.scrollArea}>
        <div className={styles.trackGrid}>
          {visibleTracks.map((name) => {
            const ts = getTrackStyle(name);
            const active = selectedTracks.has(name);
            const disabled = !active && atLimit;
            return (
              <button
                key={name}
                className={styles.trackPill}
                style={{
                  background: active ? ts.color : C.surfaceGray,
                  borderColor: active ? ts.color : "transparent",
                  color: active ? "#fff" : C.textSecondary,
                  opacity: disabled ? 0.35 : 1,
                  pointerEvents: disabled ? "none" : "auto",
                }}
                onClick={() => onToggleTrack(name)}
              >
                <span>{ts.icon}</span>
                <span>{name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.bottomBar}>
        <div className={styles.btnRow}>
          <button className={styles.backBtn} onClick={onBack}>
            Back
          </button>
          <button
            className={styles.continueBtn}
            disabled={selectedTracks.size === 0}
            onClick={onNext}
          >
            Continue &middot; {selectedTracks.size}/{MAX_TRACKS}
          </button>
        </div>
      </div>
    </div>
  );
}
