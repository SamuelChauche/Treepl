import { useState, useMemo } from "react";
import { sessions } from "../data";
import { groupSessionsByDate, toggleSet } from "../utils/session.utils";

export function useSessionFilter() {
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

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

  const grouped = useMemo(() => groupSessionsByDate(filtered), [filtered]);

  const toggleTrack = (t: string) => setSelectedTracks(toggleSet(selectedTracks, t));
  const toggleType = (t: string) => setSelectedTypes(toggleSet(selectedTypes, t));
  const clearTracks = () => setSelectedTracks(new Set());
  const clearTypes = () => setSelectedTypes(new Set());
  const toggleDay = (d: string) => setSelectedDay(selectedDay === d ? null : d);
  const selectAllDays = () => setSelectedDay(null);

  return {
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
  };
}
