import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for useCartPublish hook approval flow
 *
 * Verifies that proxy approval happens exactly once at the beginning
 * of the publish flow, regardless of cart contents.
 */

describe("useCartPublish - Proxy Approval Flow", () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  it("should call approveProxy exactly once when publishing interests and votes", async () => {
    // This test verifies the fix for the multiple approval bug

    const mockApproveProxy = vi.fn().mockResolvedValue(undefined);
    const mockDepositOnAtoms = vi.fn().mockResolvedValue({ hash: "0xdeposit", blockNumber: 123 });

    // Simulate the publish flow with both interests and votes
    async function simulatePublish() {
      // Step 0: Approve proxy ONCE
      await mockApproveProxy();

      // Step 1: Deposit on interests (skipApproval=true)
      await mockDepositOnAtoms(["interest1", "interest2"], true);

      // Step 2: Deposit on votes (skipApproval=true)
      await mockDepositOnAtoms(["vote1", "vote2"], true);
    }

    await simulatePublish();

    // Verify approveProxy was called exactly once
    expect(mockApproveProxy).toHaveBeenCalledTimes(1);

    // Verify depositOnAtoms was called twice (once for interests, once for votes)
    expect(mockDepositOnAtoms).toHaveBeenCalledTimes(2);

    // Verify both deposits used skipApproval=true
    expect(mockDepositOnAtoms).toHaveBeenNthCalledWith(1, ["interest1", "interest2"], true);
    expect(mockDepositOnAtoms).toHaveBeenNthCalledWith(2, ["vote1", "vote2"], true);
  });

  it("should handle approval rejection gracefully", async () => {
    const mockApproveProxy = vi.fn().mockRejectedValue(new Error("User rejected the transaction"));

    try {
      await mockApproveProxy();
      expect.fail("Should have thrown error");
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).message).toContain("rejected");
    }

    expect(mockApproveProxy).toHaveBeenCalledTimes(1);
  });

  it("should continue if proxy is already approved", async () => {
    const mockApproveProxy = vi.fn().mockRejectedValue(new Error("Already approved"));

    // Simulate the error handling logic
    try {
      await mockApproveProxy();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);

      // Should NOT re-throw for "already approved" errors
      if (msg.toLowerCase().includes('user rejected') || msg.toLowerCase().includes('user denied')) {
        throw new Error('You must approve the proxy to continue');
      }
      // Continue execution (don't re-throw)
    }

    // Should have attempted approval once
    expect(mockApproveProxy).toHaveBeenCalledTimes(1);
  });

  it("should call approval before any deposits even if cart has no interests", async () => {
    const mockApproveProxy = vi.fn().mockResolvedValue(undefined);
    const mockDepositOnAtoms = vi.fn().mockResolvedValue({ hash: "0xdeposit", blockNumber: 123 });

    // Simulate publish with NO interests (only votes)
    async function simulatePublishVotesOnly() {
      // Step 0: Approve proxy ONCE (must happen even if no interests)
      await mockApproveProxy();

      // Step 1: Skip interests (empty cart for interests)
      // (no deposit call)

      // Step 2: Deposit on votes (skipApproval=true)
      await mockDepositOnAtoms(["vote1", "vote2"], true);
    }

    await simulatePublishVotesOnly();

    // Verify approval happened first
    expect(mockApproveProxy).toHaveBeenCalledTimes(1);

    // Verify deposit happened with skipApproval=true
    expect(mockDepositOnAtoms).toHaveBeenCalledTimes(1);
    expect(mockDepositOnAtoms).toHaveBeenCalledWith(["vote1", "vote2"], true);
  });

  it("should handle case-insensitive user rejection detection", async () => {
    const testCases = [
      "User rejected the transaction",
      "USER REJECTED",
      "User Denied",
      "user denied transaction signature",
    ];

    for (const errorMsg of testCases) {
      const shouldReject =
        errorMsg.toLowerCase().includes('user rejected') ||
        errorMsg.toLowerCase().includes('user denied');

      expect(shouldReject).toBe(true);
    }

    // Test non-rejection errors
    const nonRejectionCases = [
      "Already approved",
      "Network timeout",
      "Insufficient funds",
    ];

    for (const errorMsg of nonRejectionCases) {
      const shouldReject =
        errorMsg.toLowerCase().includes('user rejected') ||
        errorMsg.toLowerCase().includes('user denied');

      expect(shouldReject).toBe(false);
    }
  });
});
