export interface SessionSpeaker {
  name: string;
  organization: string;
  slug: string;
}

export interface Session {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  stage: string;
  stageId: string;
  track: string;
  type: "Talk" | "Demo" | "Workshop" | "Panel";
  description: string;
  speakers: SessionSpeaker[];
}

export interface Track {
  name: string;
  sector: string;
  sessionCount: number;
  speakerCount: number;
  sessionTypes: string[];
}

export interface SessionsData {
  event: {
    name: string;
    location: string;
    dates: { start: string; end: string };
    website: string;
  };
  totalSessions: number;
  sessions: Session[];
}

export interface SpeakerTalk {
  sessionId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  stage: string;
  track: string;
  type: string;
}

export interface Speaker {
  id: string;
  slug: string;
  name: string;
  organization: string | null;
  track: string | null;
  sector: string | null;
  role: string | null;
  bio: string | null;
  twitter: string | null;
  linkedin: string | null;
  github: string | null;
  profilePictureUrl: string | null;
  talkCount: number;
  talks: SpeakerTalk[];
}

export interface TracksData {
  totalTracks: number;
  tracks: Track[];
}

// ─── Vote / Web3 Topics ─────────────────────────────────────────

export interface Web3Topic {
  id: string;
  name: string;
  type: "concept" | "project" | "trend" | "technology";
  description: string;
}

export interface Web3Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  topics: Web3Topic[];
}

export interface Web3TopicsData {
  totalTopics: number;
  totalCategories: number;
  categories: Web3Category[];
}

// ─── Prototype UI types ─────────────────────────────────────────

export interface Vibe {
  name: string;
  addr: string;
  shared: string[];
  pct: number;
  online: boolean;
  dist: string;
  px?: number;
  py?: number;
  socials?: {
    github?: string;
    twitter?: string;
    discord?: string;
    url?: string;
  };
}

export interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
  desc: string;
  score: string;
}

export interface LeaderboardUser {
  name: string;
  addr: string;
  pnl: string;
  up: boolean;
  votes: number;
  mktCap: string;
  rank: number;
  isMe?: boolean;
}
