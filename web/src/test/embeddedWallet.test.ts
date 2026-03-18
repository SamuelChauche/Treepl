import { describe, it, expect, beforeEach } from "vitest";
import {
  hasEmbeddedWallet,
  getEmbeddedAddress,
  deleteEmbeddedWallet,
} from "../services/embeddedWallet";

describe("embeddedWallet", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("storage operations (no crypto needed)", () => {
    it("should have no wallet initially", () => {
      expect(hasEmbeddedWallet()).toBe(false);
      expect(getEmbeddedAddress()).toBeNull();
    });

    it("should detect stored wallet", () => {
      localStorage.setItem("ethcc-embedded-wallet", JSON.stringify({
        address: "0x1234567890abcdef1234567890abcdef12345678",
        encryptedKey: "dGVzdA==",
        salt: "dGVzdA==",
        iv: "dGVzdA==",
      }));

      expect(hasEmbeddedWallet()).toBe(true);
      expect(getEmbeddedAddress()).toBe("0x1234567890abcdef1234567890abcdef12345678");
    });

    it("should delete wallet", () => {
      localStorage.setItem("ethcc-embedded-wallet", JSON.stringify({
        address: "0xabc",
        encryptedKey: "x",
        salt: "x",
        iv: "x",
      }));

      expect(hasEmbeddedWallet()).toBe(true);
      deleteEmbeddedWallet();
      expect(hasEmbeddedWallet()).toBe(false);
      expect(getEmbeddedAddress()).toBeNull();
    });

    it("should handle corrupted data gracefully", () => {
      localStorage.setItem("ethcc-embedded-wallet", "not-json{{{");
      expect(hasEmbeddedWallet()).toBe(true); // key exists
      expect(getEmbeddedAddress()).toBeNull(); // but parse fails
    });

    it("should return null address when no wallet", () => {
      expect(getEmbeddedAddress()).toBeNull();
    });
  });

  // Note: createEmbeddedWallet and connectEmbeddedWallet tests require
  // proper Web Crypto API + ethers.Wallet.createRandom() which doesn't
  // work in jsdom/Node. These should be tested in a browser environment
  // or with proper Node crypto polyfills.
});
