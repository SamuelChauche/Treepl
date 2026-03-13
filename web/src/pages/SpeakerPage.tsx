import { useParams, Link } from "react-router-dom";
import { speakersBySlug } from "../data";
import { getTypeCssColor } from "../config/constants";
import { formatDateLong } from "../utils/date.utils";

export function SpeakerPage() {
  const { slug } = useParams<{ slug: string }>();
  const speaker = slug ? speakersBySlug.get(slug) : undefined;

  if (!speaker) {
    return (
      <div className="speaker-page">
        <Link to="/" className="back-link">
          &larr; Back to agenda
        </Link>
        <p className="empty-state">Speaker not found.</p>
      </div>
    );
  }

  return (
    <div className="speaker-page">
      <Link to="/" className="back-link">
        &larr; Back to agenda
      </Link>

      <div className="speaker-profile">
        {speaker.profilePictureUrl && (
          <img
            src={speaker.profilePictureUrl}
            alt={speaker.name}
            className="speaker-avatar"
          />
        )}
        <div className="speaker-info">
          <h1>{speaker.name}</h1>
          {speaker.role && <p className="speaker-role">{speaker.role}</p>}
          {speaker.organization && (
            <p className="speaker-organization">{speaker.organization}</p>
          )}
          <div className="speaker-tags">
            {speaker.sector && <span className="tag">{speaker.sector}</span>}
            {speaker.track && <span className="tag">{speaker.track}</span>}
          </div>
          <div className="speaker-socials">
            {speaker.twitter && (
              <a
                href={`https://x.com/${speaker.twitter.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
              >
                @{speaker.twitter.replace("@", "")}
              </a>
            )}
            {speaker.github && (
              <a
                href={`https://github.com/${speaker.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
              >
                GitHub
              </a>
            )}
            {speaker.linkedin && (
              <a
                href={speaker.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
              >
                LinkedIn
              </a>
            )}
          </div>
        </div>
      </div>

      {speaker.bio && (
        <section className="speaker-bio">
          <h2>Bio</h2>
          <p>{speaker.bio}</p>
        </section>
      )}

      {speaker.talks.length > 0 && (
        <section className="speaker-talks">
          <h2>Talks ({speaker.talks.length})</h2>
          <div className="talk-list">
            {speaker.talks.map((talk) => (
              <div key={talk.sessionId} className="talk-card">
                <div
                  className="talk-accent"
                  style={{ background: getTypeCssColor(talk.type) }}
                />
                <div className="talk-time">
                  <span className="talk-date">{formatDateLong(talk.date)}</span>
                  <span>
                    {talk.startTime} – {talk.endTime}
                  </span>
                </div>
                <div className="talk-body">
                  <h3>{talk.title}</h3>
                  <div className="talk-meta">
                    <span className="tag">{talk.type}</span>
                    <span className="tag">{talk.track}</span>
                    <span className="tag">{talk.stage}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
