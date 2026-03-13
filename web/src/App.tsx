import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { sessions, trackNames, dates, sessionTypes, event } from "./data";
import { SessionCard } from "./SessionCard";
import type { Session } from "./types";
import "./App.css";

const CART_KEY = "ethcc-cart";
const TOPICS_KEY = "ethcc-topics";

function loadCart(): Set<string> {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

function saveCart(cart: Set<string>) {
  localStorage.setItem(CART_KEY, JSON.stringify([...cart]));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

const TYPE_COLORS: Record<string, string> = {
  Talk: "orange",
  Workshop: "yellow",
  Panel: "blue",
  Demo: "lime",
};

export default function App() {
  const navigate = useNavigate();
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Set<string>>(loadCart);

  const toggleCart = useCallback((id: string) => {
    setCart((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveCart(next);
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return sessions.filter((s) => {
      if (selectedTracks.size > 0 && !selectedTracks.has(s.track)) return false;
      if (selectedDay && s.date !== selectedDay) return false;
      if (selectedTypes.size > 0 && !selectedTypes.has(s.type)) return false;
      if (
        q &&
        !s.title.toLowerCase().includes(q) &&
        !s.description.toLowerCase().includes(q) &&
        !s.speakers.some(
          (sp) =>
            sp.name.toLowerCase().includes(q) ||
            sp.organization.toLowerCase().includes(q)
        )
      )
        return false;
      return true;
    });
  }, [selectedTracks, selectedDay, selectedTypes, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, Session[]>();
    for (const s of filtered) {
      const list = map.get(s.date) ?? [];
      list.push(s);
      map.set(s.date, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  function toggle(set: Set<string>, value: string): Set<string> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

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
              onClick={() => setSelectedDay(null)}
            >
              All
            </button>
            {dates.map((d) => (
              <button
                key={d}
                className={`pill ${selectedDay === d ? "day-active" : ""}`}
                onClick={() => setSelectedDay(selectedDay === d ? null : d)}
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
                data-color={TYPE_COLORS[t] ?? "teal"}
                onClick={() => setSelectedTypes(toggle(selectedTypes, t))}
              >
                {t}
              </button>
            ))}
            {selectedTypes.size > 0 && (
              <button
                className="filter-clear"
                onClick={() => setSelectedTypes(new Set())}
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
                onClick={() => setSelectedTracks(toggle(selectedTracks, t))}
              >
                {t}
              </button>
            ))}
            {selectedTracks.size > 0 && (
              <button
                className="filter-clear"
                onClick={() => setSelectedTracks(new Set())}
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
            <h2 className="day-heading">{formatDate(date)}</h2>
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
            onClick={() => {
              const next = new Set<string>();
              saveCart(next);
              setCart(next);
            }}
          >
            Clear
          </button>
          <button
            className="validate-btn"
            onClick={() => {
              localStorage.setItem(TOPICS_KEY, JSON.stringify([...selectedTracks]));
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
