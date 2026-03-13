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
