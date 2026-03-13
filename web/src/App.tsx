import { useNavigate } from "react-router-dom";
import { trackNames, dates, sessionTypes, event } from "./data";
import { SessionCard } from "./SessionCard";
import { TYPE_DATA_COLORS } from "./config/constants";
import { formatDateLong, formatDateShort } from "./utils/date.utils";
import { StorageService } from "./services/StorageService";
import { useCart } from "./hooks/useCart";
import { useSessionFilter } from "./hooks/useSessionFilter";
import "./App.css";

export default function App() {
  const navigate = useNavigate();
  const { cart, toggleCart, clearCart } = useCart();
  const {
    selectedTracks,
    selectedDay,
    selectedTypes,
    search,
    setSearch,
    filtered,
    grouped,
    toggleTrack,
    toggleType,
    clearTracks,
    clearTypes,
    toggleDay,
    selectAllDays,
  } = useSessionFilter();

  return (
    <div className="app">
      {/* Hero */}
      <header className="hero">
        <div className="hero-inner">
          <img src="/images/ethcc_logo.svg" alt="EthCC" className="hero-logo" />
          <div>
            <h1>{event.name}</h1>
            <p className="hero-sub">
              {event.location} &middot; {event.dates.start} &rarr;{" "}
              {event.dates.end}
            </p>
          </div>
        </div>
      </header>

      {/* Unified toolbar */}
      <div className="toolbar">
        {/* Row 1: Search + session count */}
        <div className="toolbar-row-horizontal">
          <div className="search-box">
            <span className="search-icon">&#x1F50D;</span>
            <input
              type="text"
              placeholder="Search sessions, speakers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="session-count">
            <strong>{filtered.length}</strong> session
            {filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Row 2: Day */}
        <div className="toolbar-row">
          <span className="toolbar-row-label">Day</span>
          <div className="toolbar-row-pills">
            <button
              className={`pill ${selectedDay === null ? "all-active" : ""}`}
              onClick={selectAllDays}
            >
              All
            </button>
            {dates.map((d) => (
              <button
                key={d}
                className={`pill ${selectedDay === d ? "day-active" : ""}`}
                onClick={() => toggleDay(d)}
              >
                {formatDateShort(d)}
              </button>
            ))}
          </div>
        </div>

        <div className="toolbar-divider" />

        {/* Type */}
        <div className="toolbar-row">
          <span className="toolbar-row-label">Type</span>
          <div className="toolbar-row-pills">
            {sessionTypes.map((t) => (
              <button
                key={t}
                className={`pill ${selectedTypes.has(t) ? "filter-active" : ""}`}
                data-color={TYPE_DATA_COLORS[t] ?? "teal"}
                onClick={() => toggleType(t)}
              >
                {t}
              </button>
            ))}
            {selectedTypes.size > 0 && (
              <button
                className="filter-clear"
                onClick={clearTypes}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Topic */}
        <div className="toolbar-row">
          <span className="toolbar-row-label">Topic</span>
          <div className="toolbar-row-pills pills-wrap">
            {trackNames.map((t) => (
              <button
                key={t}
                className={`pill ${selectedTracks.has(t) ? "filter-active" : ""}`}
                data-color="teal"
                onClick={() => toggleTrack(t)}
              >
                {t}
              </button>
            ))}
            {selectedTracks.size > 0 && (
              <button
                className="filter-clear"
                onClick={clearTracks}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Session list */}
      <main className="content">
        {grouped.map(([date, list]) => (
          <section key={date} className="day-group">
            <h2 className="day-heading">{formatDateLong(date)}</h2>
            <div className="session-grid">
              {list.map((s, i) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  index={i}
                  selected={cart.has(s.id)}
                  onSelect={toggleCart}
                />
              ))}
            </div>
          </section>
        ))}
        {filtered.length === 0 && (
          <p className="empty-state">No sessions match your filters.</p>
        )}
      </main>

      {/* Validate button */}
      {cart.size > 0 && (
        <div className="validate-bar">
          <button
            className="validate-clear-btn"
            onClick={clearCart}
          >
            Clear
          </button>
          <button
            className="validate-btn"
            onClick={() => {
              StorageService.saveTopics(selectedTracks);
              navigate("/profile");
            }}
          >
            Validate ({cart.size} session{cart.size !== 1 ? "s" : ""})
          </button>
        </div>
      )}
    </div>
  );
}
