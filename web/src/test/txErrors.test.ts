import { describe, it, expect } from "vitest";
import { formatTxError } from "../utils/txErrors";

describe("formatTxError", () => {
  it("maps INSUFFICIENT_FUNDS", () => {
    const err = new Error("insufficient funds for gas * price + value");
    expect(formatTxError(err)).toBe("Not enough TRUST to complete this transaction. Send more TRUST to your wallet.");
  });

  it("maps ACTION_REJECTED", () => {
    expect(formatTxError(new Error("user rejected transaction")))
      .toBe("Transaction cancelled — you rejected it in your wallet.");
  });

  it("maps CALL_EXCEPTION", () => {
    expect(formatTxError(new Error("execution reverted")))
      .toBe("Smart contract call failed. The operation may not be allowed.");
  });

  it("maps network errors", () => {
    expect(formatTxError(new Error("network error")))
      .toBe("Network error — check your internet connection.");
  });

  it("maps wrong password", () => {
    expect(formatTxError(new Error("Wrong password")))
      .toBe("Wrong password. Please try again.");
  });

  it("maps SofiaFeeProxy errors", () => {
    expect(formatTxError(new Error("SofiaFeeProxy_InsufficientValue")))
      .toBe("Not enough value sent to cover the proxy fee. Try again.");
  });

  it("truncates very long unknown errors", () => {
    const long = "x".repeat(300);
    expect(formatTxError(new Error(long))).toBe("Transaction failed. Please try again.");
  });

  it("passes through short unknown errors", () => {
    expect(formatTxError(new Error("Some short error"))).toBe("Some short error");
  });

  it("handles non-Error values", () => {
    expect(formatTxError("string error")).toBe("string error");
    expect(formatTxError(42)).toBe("42");
  });
});
