import type { Vibe } from "../../types";
import styles from "./VibeCard.module.css";

interface Props {
  vibe: Vibe;
  onClick: () => void;
}

export function VibeCard({ vibe, onClick }: Props) {
  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.topRow}>
        <div className={styles.avatar}>
          {vibe.name.slice(0, 2).toUpperCase()}
        </div>
        <div className={styles.nameWrap}>
          <div className={styles.name}>{vibe.name}</div>
          <div className={styles.dist}>{vibe.dist} away</div>
        </div>
      </div>
      <div className={styles.statusRow}>
        <div className={styles.onlineDot} />
        <span className={styles.onlineLabel}>Online</span>
        <span className={styles.matchPct}>{vibe.pct}% match</span>
      </div>
      <div className={styles.tags}>
        {vibe.shared.slice(0, 2).map((s) => (
          <span key={s} className={styles.tag}>{s}</span>
        ))}
      </div>
    </div>
  );
}
