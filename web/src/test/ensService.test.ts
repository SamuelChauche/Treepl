import { describe, it, expect } from "vitest";
import { getSocialLinks, type EnsProfile } from "../services/ensService";

describe("ensService", () => {
  describe("getSocialLinks", () => {
    it("should return empty array for empty profile", () => {
      const profile: EnsProfile = {
        name: null, avatar: null, github: null, twitter: null,
        discord: null, url: null, description: null, email: null,
      };
      expect(getSocialLinks(profile)).toEqual([]);
    });

    it("should build GitHub link", () => {
      const profile: EnsProfile = {
        name: "test.eth", avatar: null, github: "octocat", twitter: null,
        discord: null, url: null, description: null, email: null,
      };
      const links = getSocialLinks(profile);
      expect(links).toHaveLength(1);
      expect(links[0]).toEqual({
        label: "octocat",
        url: "https://github.com/octocat",
        icon: "🐙",
      });
    });

    it("should build Twitter link with @ prefix handling", () => {
      const profile: EnsProfile = {
        name: "test.eth", avatar: null, github: null, twitter: "@vitalik",
        discord: null, url: null, description: null, email: null,
      };
      const links = getSocialLinks(profile);
      expect(links[0].label).toBe("@vitalik");
      expect(links[0].url).toBe("https://x.com/vitalik");
    });

    it("should build Twitter link without @ prefix", () => {
      const profile: EnsProfile = {
        name: "test.eth", avatar: null, github: null, twitter: "vitalik",
        discord: null, url: null, description: null, email: null,
      };
      const links = getSocialLinks(profile);
      expect(links[0].label).toBe("@vitalik");
      expect(links[0].url).toBe("https://x.com/vitalik");
    });

    it("should build website link and strip protocol", () => {
      const profile: EnsProfile = {
        name: "test.eth", avatar: null, github: null, twitter: null,
        discord: null, url: "https://ethereum.org", description: null, email: null,
      };
      const links = getSocialLinks(profile);
      expect(links[0].label).toBe("ethereum.org");
      expect(links[0].url).toBe("https://ethereum.org");
    });

    it("should build all links when all fields present", () => {
      const profile: EnsProfile = {
        name: "test.eth", avatar: "https://img.com/a.png",
        github: "user", twitter: "handle", discord: "user#1234",
        url: "https://example.com", description: "bio", email: "a@b.com",
      };
      const links = getSocialLinks(profile);
      expect(links).toHaveLength(4); // github, twitter, discord, url
      expect(links.map((l) => l.icon)).toEqual(["🐙", "𝕏", "💬", "🌐"]);
    });
  });
});
