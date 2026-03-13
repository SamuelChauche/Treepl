import { Link } from "react-router-dom";
import type { Session } from "../../types";
import { getTypeCssColor } from "../../config/constants";

export function SessionCard({
  session,
  index,
  selected,
  onSelect,
}: {
  session: Session;
  index: number;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const borderColor = getTypeCssColor(session.type);

  return (
    <article
      className={`session-card ${selected ? "session-card-selected" : ""}`}
      style={{
        animationDelay: `${Math.min(index * 40, 400)}ms`,
        ...(selected ? { borderColor } : {}),
      }}
      onClick={() => onSelect(session.id)}
    >
      <div className="card-accent" data-type={session.type} />
      <div className="card-body">
        <div className="card-top">
          <span className="card-type" data-type={session.type}>
            {session.type}
          </span>
          <span className="card-stage">{session.stage}</span>
        </div>
        <h3 className="card-title">{session.title}</h3>
        {session.description && (
          <p className="card-desc">{session.description}</p>
        )}
        <div className="card-footer">
          <span className="card-time">
            {session.startTime} – {session.endTime}
          </span>
          <span className="card-track">{session.track}</span>
          {session.speakers.length > 0 && (
            <div className="card-speakers">
              {session.speakers.map((sp) => (
                <Link
                  key={sp.slug}
                  to={`/speaker/${sp.slug}`}
                  className="card-speaker"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="card-speaker-dot" />
                  {sp.name}
                  {sp.organization && (
                    <span className="speaker-org"> · {sp.organization}</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
