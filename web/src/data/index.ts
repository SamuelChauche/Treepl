import sessionsJson from "../../../bdd/sessions.json";
import tracksJson from "../../../bdd/tracks.json";
import speakersJson from "../../../bdd/speakers.json";
import ratingsGraphJson from "../../../bdd/session_ratings_graph.json";
import type { Session, Track, Speaker } from "../types";

export const sessions: Session[] = (sessionsJson as unknown as { sessions: Session[] }).sessions;
export const tracks: Track[] = (tracksJson as { tracks: Track[] }).tracks;
export const speakers: Speaker[] = (speakersJson as unknown as { speakers: Speaker[] }).speakers;
export const event = { name: "EthCC[9]", location: "Cannes, France", dates: { start: "2026-03-30", end: "2026-04-02" } };

export const speakersBySlug = new Map(speakers.map((s) => [s.slug, s]));

export const trackNames = tracks.map((t) => t.name).sort();
export const dates = [...new Set(sessions.map((s) => s.date))].sort();
export const sessionTypes = [...new Set(sessions.map((s) => s.type))].sort();

// Rating graph — atom IDs and triple data for on-chain ratings
export const ratingsGraph = ratingsGraphJson as {
  ratingAtoms: Record<string, string>;
  hasTagPredicate: string;
  sessionRatingTriples: Record<string, Record<string, {
    txHash: string;
    blockNumber: number;
    subjectId: string;
    predicateId: string;
    objectId: string;
  }>>;
};
