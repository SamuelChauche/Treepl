import { describe, it, expect } from "vitest";
import { sessions, tracks, speakers, ratingsGraph, dates, trackNames } from "../data";

describe("Data layer", () => {
  describe("sessions", () => {
    it("should have 83 sessions", () => {
      expect(sessions.length).toBe(83);
    });

    it("should have required fields on each session", () => {
      for (const s of sessions) {
        expect(s.id).toBeTruthy();
        expect(s.title).toBeTruthy();
        expect(s.date).toBeTruthy();
        expect(s.track).toBeTruthy();
        expect(s.type).toBeTruthy();
        expect(s.stage).toBeTruthy();
      }
    });

    it("should have startTime and endTime", () => {
      for (const s of sessions) {
        expect(s.startTime).toBeTruthy();
        expect(s.endTime).toBeTruthy();
      }
    });
  });

  describe("tracks", () => {
    it("should have 17 tracks", () => {
      expect(tracks.length).toBe(17);
    });

    it("should have trackNames sorted", () => {
      const sorted = [...trackNames].sort();
      expect(trackNames).toEqual(sorted);
    });
  });

  describe("speakers", () => {
    it("should have 278 speakers", () => {
      expect(speakers.length).toBe(278);
    });

    it("should have slug and name", () => {
      for (const sp of speakers) {
        expect(sp.slug).toBeTruthy();
        expect(sp.name).toBeTruthy();
      }
    });
  });

  describe("dates", () => {
    it("should have multiple dates", () => {
      expect(dates.length).toBeGreaterThan(0);
    });

    it("should be sorted", () => {
      const sorted = [...dates].sort();
      expect(dates).toEqual(sorted);
    });
  });

  describe("ratingsGraph", () => {
    it("should have 5 rating atoms", () => {
      const keys = Object.keys(ratingsGraph.ratingAtoms);
      expect(keys).toEqual(["1", "2", "3", "4", "5"]);
    });

    it("should have valid atom IDs (bytes32)", () => {
      for (const atomId of Object.values(ratingsGraph.ratingAtoms)) {
        expect(atomId).toMatch(/^0x[a-fA-F0-9]{64}$/);
      }
    });

    it("should have hasTagPredicate", () => {
      expect(ratingsGraph.hasTagPredicate).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it("should have 83 sessions in sessionRatingTriples", () => {
      const sessionCount = Object.keys(ratingsGraph.sessionRatingTriples).length;
      expect(sessionCount).toBe(83);
    });

    it("should have 5 ratings per session", () => {
      for (const [, ratings] of Object.entries(ratingsGraph.sessionRatingTriples)) {
        const ratingKeys = Object.keys(ratings);
        expect(ratingKeys).toEqual(["1", "2", "3", "4", "5"]);
        // Each rating should have subjectId, predicateId, objectId
        for (const r of Object.values(ratings)) {
          expect(r.subjectId).toMatch(/^0x[a-fA-F0-9]{64}$/);
          expect(r.predicateId).toBe(ratingsGraph.hasTagPredicate);
          expect(r.objectId).toMatch(/^0x[a-fA-F0-9]{64}$/);
        }
      }
    });
  });
});
