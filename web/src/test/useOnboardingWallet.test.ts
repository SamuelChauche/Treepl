import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock dependencies
vi.mock("../hooks/useWalletConnection", () => ({
  useWalletConnection: () => ({
    wallet: null, address: null, isConnected: false,
    loading: false, error: "", balance: null,
    connect: vi.fn(), disconnect: vi.fn(),
  }),
}));

vi.mock("@reown/appkit/react", () => ({
  useAppKitAccount: () => ({ address: null, isConnected: false }),
  useAppKitProvider: () => ({ walletProvider: null }),
  useAppKit: () => ({ open: vi.fn() }),
  useDisconnect: () => ({ disconnect: vi.fn() }),
}));

const mockCreateEmbedded = vi.fn();
const mockConnectEmbedded = vi.fn();
vi.mock("../services/embeddedWallet", () => ({
  createEmbeddedWallet: (...args: unknown[]) => mockCreateEmbedded(...args),
  connectEmbeddedWallet: (...args: unknown[]) => mockConnectEmbedded(...args),
  markBackupDone: vi.fn(),
  deleteEmbeddedWallet: vi.fn(),
  hasEmbeddedWallet: () => false,
  getEmbeddedAddress: () => null,
}));

vi.mock("../contexts/EmbeddedWalletContext", () => ({
  useEmbeddedWallet: () => ({
    wallet: null, address: "", balance: null, needsUnlock: false,
    unlocking: false, error: "",
    unlock: vi.fn(async () => true), disconnect: vi.fn(),
    refreshBalance: vi.fn(), setWalletDirectly: vi.fn(),
  }),
}));

import { useOnboardingWallet } from "../hooks/useOnboardingWallet";

describe("useOnboardingWallet", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("starts in idle state with no wallet", () => {
    const { result } = renderHook(() => useOnboardingWallet());
    expect(result.current.effectiveWallet).toBeNull();
    expect(result.current.effectiveAddress).toBe("");
    expect(result.current.effectiveBalance).toBeNull();
    expect(result.current.computeWalletState("idle")).toBe("idle");
  });

  it("computeWalletState returns signing when txState is signing", () => {
    const { result } = renderHook(() => useOnboardingWallet());
    expect(result.current.computeWalletState("signing")).toBe("signing");
    expect(result.current.computeWalletState("done")).toBe("done");
  });

  it("handleCreateEmbedded rejects short passwords", async () => {
    const { result } = renderHook(() => useOnboardingWallet());
    await act(async () => {
      await result.current.handleCreateEmbedded("ab");
    });
    expect(result.current.txError).toBe("Password must be at least 4 characters");
    expect(mockCreateEmbedded).not.toHaveBeenCalled();
  });

  it("handleCreateEmbedded calls createEmbeddedWallet with password", async () => {
    const mockConn = {
      provider: { getBalance: vi.fn().mockResolvedValue(BigInt(0)) },
      signer: {}, proxy: {}, multiVault: {},
      address: "0x1234", ethers: { formatEther: () => "0" },
    };
    mockCreateEmbedded.mockResolvedValue({ address: "0x1234", privateKey: "0xkey" });
    mockConnectEmbedded.mockResolvedValue(mockConn);

    const { result } = renderHook(() => useOnboardingWallet());
    await act(async () => {
      await result.current.handleCreateEmbedded("testpass");
    });
    expect(mockCreateEmbedded).toHaveBeenCalledWith("testpass");
    expect(mockConnectEmbedded).toHaveBeenCalledWith("testpass");
  });

  it("handleUnlockEmbedded returns false on wrong password", async () => {
    mockConnectEmbedded.mockRejectedValue(new Error("Wrong password"));
    const { result } = renderHook(() => useOnboardingWallet());
    let success = false;
    await act(async () => {
      success = await result.current.handleUnlockEmbedded("wrong");
    });
    expect(success).toBe(false);
    expect(result.current.txError).toBe("Wrong password. Please try again.");
  });

  it("handleDisconnect clears wallet state", () => {
    const { result } = renderHook(() => useOnboardingWallet());
    act(() => { result.current.handleDisconnect(); });
    expect(result.current.effectiveWallet).toBeNull();
    expect(localStorage.getItem("ethcc-wallet-address")).toBeNull();
  });
});
