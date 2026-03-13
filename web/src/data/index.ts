import sessionsJson from "../../../bdd/sessions.json";
import tracksJson from "../../../bdd/tracks.json";
import speakersJson from "../../../bdd/speakers.json";
import type { Session, Track, Speaker } from "../types";

export const sessions: Session[] = (sessionsJson as { sessions: Session[] }).sessions;
export const tracks: Track[] = (tracksJson as { tracks: Track[] }).tracks;
export const speakers: Speaker[] = (speakersJson as { speakers: Speaker[] }).speakers;
export const event = (sessionsJson as { event: { name: string; location: string; dates: { start: string; end: string } } }).event;

export const speakersBySlug = new Map(speakers.map((s) => [s.slug, s]));

export const trackNames = tracks.map((t) => t.name).sort();
export const dates = [...new Set(sessions.map((s) => s.date))].sort();
export const sessionTypes = [...new Set(sessions.map((s) => s.type))].sort();
