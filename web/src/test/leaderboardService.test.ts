import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchLeaderboard, fetchTransferHistory } from "../services/leaderboardService";

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe("leaderboardService", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("fetchLeaderboard", () => {
    it("should return empty array for no addresses", async () => {
      const result = await fetchLeaderboard([]);
      expect(result).toEqual([]);
    });

    it("should parse Blockscout transactions and rank by total sent", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [
            {
              from: { hash: "0xAlice" },
              to: { hash: "0xBob" },
              value: "5000000000000000000", // 5 TRUST
              hash: "0xtx1",
              timestamp: "2026-03-18T10:00:00Z",
              tx_types: ["coin_transfer"],
            },
            {
              from: { hash: "0xAlice" },
              to: { hash: "0xCarol" },
              value: "3000000000000000000", // 3 TRUST
              hash: "0xtx2",
              timestamp: "2026-03-18T11:00:00Z",
              tx_types: ["coin_transfer"],
            },
          ],
        }),
      });

      const result = await fetchLeaderboard(["0xAlice"]);

      expect(result).toHaveLength(1);
      expect(result[0].address).toBe("0xAlice");
      expect(result[0].totalSent).toBe(8); // 5 + 3
      expect(result[0].txCount).toBe(2);
      expect(result[0].rank).toBe(1);
    });

    it("should skip addresses with failed fetches", async () => {
      mockFetch.mockResolvedValue({ ok: false });

      const result = await fetchLeaderboard(["0xBadAddr"]);
      expect(result).toEqual([]);
    });

    it("should use labels when provided", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [
            {
              from: { hash: "0xalice" },
              to: { hash: "0xbob" },
              value: "1000000000000000000",
              hash: "0xtx1",
              timestamp: "2026-03-18T10:00:00Z",
              tx_types: ["coin_transfer"],
            },
          ],
        }),
      });

      const result = await fetchLeaderboard(
        ["0xalice"],
        { "0xalice": "Alice.eth" }
      );

      expect(result[0].label).toBe("Alice.eth");
    });
  });

  describe("fetchTransferHistory", () => {
    it("should separate sent and received transfers", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [
            {
              from: { hash: "0xMe" },
              to: { hash: "0xOther" },
              value: "2000000000000000000",
              hash: "0xtx1",
              timestamp: "2026-03-18T10:00:00Z",
            },
            {
              from: { hash: "0xSomeone" },
              to: { hash: "0xMe" },
              value: "1000000000000000000",
              hash: "0xtx2",
              timestamp: "2026-03-18T11:00:00Z",
            },
          ],
        }),
      });

      const result = await fetchTransferHistory("0xMe");

      expect(result.sent).toHaveLength(1);
      expect(result.sent[0].to).toBe("0xOther");
      expect(result.sent[0].amount).toBe(2);

      expect(result.received).toHaveLength(1);
      expect(result.received[0].from).toBe("0xSomeone");
      expect(result.received[0].amount).toBe(1);
    });
  });
});
