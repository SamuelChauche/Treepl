import { dates, sessionTypes, trackNames } from "../../data";
import { TYPE_DATA_COLORS } from "../../config/constants";
import { formatDateShort } from "../../utils/date.utils";

interface ToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filteredCount: number;
  selectedDay: string | null;
  onSelectAllDays: () => void;
  onToggleDay: (day: string) => void;
  selectedTypes: Set<string>;
  onToggleType: (type: string) => void;
  onClearTypes: () => void;
  selectedTracks: Set<string>;
  onToggleTrack: (track: string) => void;
  onClearTracks: () => void;
}

export function Toolbar({
  search,
  onSearchChange,
  filteredCount,
  selectedDay,
  onSelectAllDays,
  onToggleDay,
  selectedTypes,
  onToggleType,
  onClearTypes,
  selectedTracks,
  onToggleTrack,
  onClearTracks,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      {/* Row 1: Search + session count */}
      <div className="toolbar-row-horizontal">
        <div className="search-box">
          <span className="search-icon">&#x1F50D;</span>
          <input
            type="text"
            placeholder="Search sessions, speakers..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <span className="session-count">
          <strong>{filteredCount}</strong> session
          {filteredCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Row 2: Day */}
      <div className="toolbar-row">
        <span className="toolbar-row-label">Day</span>
        <div className="toolbar-row-pills">
          <button
            className={`pill ${selectedDay === null ? "all-active" : ""}`}
            onClick={onSelectAllDays}
          >
            All
          </button>
          {dates.map((d) => (
            <button
              key={d}
              className={`pill ${selectedDay === d ? "day-active" : ""}`}
              onClick={() => onToggleDay(d)}
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
              onClick={() => onToggleType(t)}
            >
              {t}
            </button>
          ))}
          {selectedTypes.size > 0 && (
            <button className="filter-clear" onClick={onClearTypes}>
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
              onClick={() => onToggleTrack(t)}
            >
              {t}
            </button>
          ))}
          {selectedTracks.size > 0 && (
            <button className="filter-clear" onClick={onClearTracks}>
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
