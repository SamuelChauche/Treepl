import { useNavigate } from "react-router-dom";
import { event } from "../data";
import { SessionCard } from "../components/session/SessionCard";
import { formatDateLong } from "../utils/date.utils";
import { StorageService } from "../services/StorageService";
import { useCart } from "../hooks/useCart";
import { useSessionFilter } from "../hooks/useSessionFilter";
import { Toolbar } from "../components/toolbar/Toolbar";
import "../styles/index.css";

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
          <img src={`${import.meta.env.BASE_URL}images/ethcc_logo.svg`} alt="EthCC" className="hero-logo" />
          <div>
            <h1>{event.name}</h1>
            <p className="hero-sub">
              {event.location} &middot; {event.dates.start} &rarr;{" "}
              {event.dates.end}
            </p>
          </div>
        </div>
      </header>

      <Toolbar
        search={search}
        onSearchChange={setSearch}
        filteredCount={filtered.length}
        selectedDay={selectedDay}
        onSelectAllDays={selectAllDays}
        onToggleDay={toggleDay}
        selectedTypes={selectedTypes}
        onToggleType={toggleType}
        onClearTypes={clearTypes}
        selectedTracks={selectedTracks}
        onToggleTrack={toggleTrack}
        onClearTracks={clearTracks}
      />

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
          <button className="validate-clear-btn" onClick={clearCart}>
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
