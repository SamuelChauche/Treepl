import { C, getTrackStyle } from "../../config/theme";
import { trackNames } from "../../data";
import styles from "./InterestPicker.module.css";
import shared from "../../styles/shared.module.css";

interface Props {
  selectedTracks: Set<string>;
  onToggleTrack: (name: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function InterestPicker({ selectedTracks, onToggleTrack, onBack, onNext }: Props) {
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
          Published on Intuition Protocol as on-chain triples.
        </p>
      </div>

      <div className={styles.scrollArea}>
        <div className={styles.trackGrid}>
          {trackNames.map((name) => {
            const ts = getTrackStyle(name);
            const active = selectedTracks.has(name);
            return (
              <button
                key={name}
                className={styles.trackPill}
                style={{
                  background: active ? ts.color : C.surfaceGray,
                  borderColor: active ? ts.color : "transparent",
                  color: active ? "#fff" : C.textSecondary,
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
            Continue &middot; {selectedTracks.size} selected
          </button>
        </div>
      </div>
    </div>
  );
}
