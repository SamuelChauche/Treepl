import type { Session } from "../types";

export function groupSessionsByDate(
  sessions: Session[]
): [string, Session[]][] {
  const map = new Map<string, Session[]>();
  for (const s of sessions) {
    const list = map.get(s.date) ?? [];
    list.push(s);
    map.set(s.date, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export function toggleSet(set: Set<string>, value: string): Set<string> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}
