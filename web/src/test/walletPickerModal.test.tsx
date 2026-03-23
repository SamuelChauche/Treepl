import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WalletPickerModal } from "../components/onboarding/WalletPickerModal";

// Mock CSS modules
vi.mock("../components/onboarding/WalletPickerModal.module.css", () => ({
  default: new Proxy({}, { get: (_t, prop) => String(prop) }),
}));
vi.mock("../../styles/shared.module.css", () => ({
  default: new Proxy({}, { get: (_t, prop) => String(prop) }),
}));

// Mock embeddedWallet service
vi.mock("../../services/embeddedWallet", () => ({
  hasEmbeddedWallet: vi.fn(() => false),
}));

// Mock Icons component
vi.mock("../components/ui/Icons", () => ({
  Ic: new Proxy({}, {
    get: () => (_props: { s?: number; c?: string }) => <span data-testid="icon" />,
  }),
}));

function renderModal(overrides: Partial<Parameters<typeof WalletPickerModal>[0]> = {}) {
  const defaults = {
    onClose: vi.fn(),
    onExternalWallet: vi.fn(),
    onCreateEmbedded: vi.fn(async () => {}),
    onUnlockEmbedded: vi.fn(async () => {}),
    onBackupDone: vi.fn(),
    embeddedMode: "none" as const,
    setEmbeddedMode: vi.fn(),
    embeddedPrivateKey: "",
    embeddedKeyCopied: false,
    setEmbeddedKeyCopied: vi.fn(),
    txError: "",
  };
  const props = { ...defaults, ...overrides };
  return { ...render(<WalletPickerModal {...props} />), props };
}

describe("WalletPickerModal", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("initial state (no embedded wallet)", () => {
    it("renders the title", () => {
      renderModal();
      expect(screen.getByText("Connect Wallet")).toBeTruthy();
    });

    it("shows External Wallet option", () => {
      renderModal();
      expect(screen.getByText("External Wallet")).toBeTruthy();
      expect(screen.getByText("MetaMask, WalletConnect, Coinbase...")).toBeTruthy();
    });

    it("shows Create Embedded Wallet option when no existing wallet", () => {
      renderModal();
      expect(screen.getByText("Create Embedded Wallet")).toBeTruthy();
    });

    it("calls onExternalWallet when External Wallet is clicked", () => {
      vi.useFakeTimers();
      const { props } = renderModal();
      fireEvent.click(screen.getByText("External Wallet"));
      expect(props.onExternalWallet).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it("calls setEmbeddedMode('create') when Create Embedded Wallet is clicked", () => {
      const { props } = renderModal();
      fireEvent.click(screen.getByText("Create Embedded Wallet"));
      expect(props.setEmbeddedMode).toHaveBeenCalledWith("create");
    });
  });

  describe("create mode", () => {
    it("shows password form", () => {
      renderModal({ embeddedMode: "create" });
      expect(screen.getByText("Create a password for your wallet")).toBeTruthy();
      expect(screen.getByPlaceholderText("Password")).toBeTruthy();
      expect(screen.getByText("Create Wallet")).toBeTruthy();
    });

    it("calls onCreateEmbedded with password on submit", () => {
      const { props } = renderModal({ embeddedMode: "create" });
      fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "mypass" } });
      fireEvent.click(screen.getByText("Create Wallet"));
      expect(props.onCreateEmbedded).toHaveBeenCalledWith("mypass");
    });

    it("shows txError when provided", () => {
      renderModal({ embeddedMode: "create", txError: "Password must be at least 4 characters" });
      expect(screen.getByText("Password must be at least 4 characters")).toBeTruthy();
    });

    it("has a Back button that resets mode", () => {
      const { props } = renderModal({ embeddedMode: "create" });
      fireEvent.click(screen.getByText("Back"));
      expect(props.setEmbeddedMode).toHaveBeenCalledWith("none");
    });
  });

  describe("unlock mode", () => {
    it("shows unlock form", () => {
      renderModal({ embeddedMode: "unlock" });
      expect(screen.getByText("Enter your wallet password")).toBeTruthy();
      expect(screen.getByText("Unlock")).toBeTruthy();
    });

    it("calls onUnlockEmbedded with password", () => {
      const { props } = renderModal({ embeddedMode: "unlock" });
      fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "secret" } });
      fireEvent.click(screen.getByText("Unlock"));
      expect(props.onUnlockEmbedded).toHaveBeenCalledWith("secret");
    });
  });

  describe("backup mode", () => {
    const PK = "0xdeadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678";

    it("shows private key and warning", () => {
      renderModal({ embeddedMode: "backup", embeddedPrivateKey: PK });
      expect(screen.getByText(/Save your private key/)).toBeTruthy();
      expect(screen.getByText(PK)).toBeTruthy();
    });

    it("shows Copy Private Key button", () => {
      renderModal({ embeddedMode: "backup", embeddedPrivateKey: PK });
      expect(screen.getByText("Copy Private Key")).toBeTruthy();
    });

    it("shows Copied! when key was copied", () => {
      renderModal({ embeddedMode: "backup", embeddedPrivateKey: PK, embeddedKeyCopied: true });
      expect(screen.getByText("Copied!")).toBeTruthy();
    });

    it("copies key to clipboard on click", () => {
      const { props } = renderModal({ embeddedMode: "backup", embeddedPrivateKey: PK });
      fireEvent.click(screen.getByText("Copy Private Key"));
      expect(props.setEmbeddedKeyCopied).toHaveBeenCalledWith(true);
    });

    it("calls onBackupDone on continue", () => {
      const { props } = renderModal({ embeddedMode: "backup", embeddedPrivateKey: PK });
      fireEvent.click(screen.getByText("I've saved it — Continue"));
      expect(props.onBackupDone).toHaveBeenCalled();
    });
  });

  describe("overlay click", () => {
    it("closes modal when clicking overlay in none mode", () => {
      const { props, container } = renderModal();
      // Click the overlay (first child div)
      const overlay = container.firstElementChild as HTMLElement;
      fireEvent.click(overlay);
      expect(props.onClose).toHaveBeenCalled();
    });
  });
});
