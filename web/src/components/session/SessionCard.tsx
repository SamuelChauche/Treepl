import { getTrackStyle, TYPE_COLORS, C } from "../../config/theme";
import type { Session } from "../../types";
import styles from "./SessionCard.module.css";

interface Props {
  session: Session;
  onClick?: () => void;
  /** Slot for right-side action (cart button, etc.) */
  action?: React.ReactNode;
  /** Show as locked (pending interest) */
  locked?: boolean;
}

export function SessionCard({ session, onClick, action, locked }: Props) {
  const ts = getTrackStyle(session.track);
  const speakerLine = session.speakers.map((sp) => sp.name).join(", ");

  if (locked) {
    return (
      <div className={styles.card} style={{ opacity: 0.5, cursor: "default" }}>
        <div className={styles.icon} style={{ background: `${ts.color}22` }}>
          🔒
        </div>
        <div className={styles.content}>
          <div className={styles.lockedTitle}>Session locked</div>
          <div className={styles.lockedDesc}>Validate the tx to see this event</div>
          <div className={styles.tags}>
            <span className={styles.tag} style={{ background: `${ts.color}22`, color: ts.color }}>
              {session.track}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.accentBar} style={{ background: ts.color }} />
      <div className={styles.icon} style={{ background: `${ts.color}22` }}>
        {ts.icon}
      </div>
      <div className={styles.content}>
        <div className={styles.title}>{session.title}</div>
        {speakerLine && <div className={styles.speakers}>{speakerLine}</div>}
        <div className={styles.time}>
          {session.startTime} - {session.endTime} &middot; {session.stage}
        </div>
        <div className={styles.tags}>
          <span className={styles.tag} style={{ background: `${ts.color}22`, color: ts.color }}>
            {session.track}
          </span>
          <span className={styles.tag} style={{ background: `${TYPE_COLORS[session.type] ?? C.primary}22`, color: TYPE_COLORS[session.type] ?? C.primary }}>
            {session.type}
          </span>
        </div>
      </div>
      {action}
    </div>
  );
}
