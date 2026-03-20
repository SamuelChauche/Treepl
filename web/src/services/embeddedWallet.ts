import { CHAIN_CONFIG } from "../config/constants";
import { SofiaFeeProxyAbi } from "../config/SofiaFeeProxyABI";
import type { WalletConnection } from "./intuition";

const STORAGE_KEY = "ethcc-embedded-wallet";

const MULTIVAULT_ABI = [
  "function getTripleCost() view returns (uint256)",
  "function getAtomCost() view returns (uint256)",
  "function calculateAtomId(bytes data) pure returns (bytes32)",
  "function isTermCreated(bytes32 id) view returns (bool)",
  "function approve(address sender, uint8 approvalType)",
  "function redeem(address receiver, bytes32 termId, uint256 curveId, uint256 shares, uint256 minAssets) returns (uint256)",
  "function previewRedeem(bytes32 termId, uint256 curveId, uint256 shares) view returns (uint256 assetsAfterFees, uint256 sharesUsed)",
  "function maxRedeem(address account, bytes32 termId, uint256 curveId) view returns (uint256)",
  "function currentSharePrice(bytes32 id, uint256 curveId) view returns (uint256)",
];

interface StoredWallet {
  address: string;
  encryptedKey: string;  // base64-encoded encrypted private key
  salt: string;          // base64-encoded salt
  iv: string;            // base64-encoded IV
}

// ─── Crypto helpers (Web Crypto API) ─────────────────────────────

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptPrivateKey(privateKey: string, password: string): Promise<{ encrypted: string; salt: string; iv: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, key, enc.encode(privateKey)
  );
  return {
    encrypted: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    salt: btoa(String.fromCharCode(...salt)),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

async function decryptPrivateKey(stored: StoredWallet, password: string): Promise<string> {
  const salt = Uint8Array.from(atob(stored.salt), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(stored.iv), c => c.charCodeAt(0));
  const ciphertext = Uint8Array.from(atob(stored.encryptedKey), c => c.charCodeAt(0));
  const key = await deriveKey(password, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv }, key, ciphertext
  );
  return new TextDecoder().decode(decrypted);
}

// ─── Public API ──────────────────────────────────────────────────

/** Check if an embedded wallet exists in localStorage */
export function hasEmbeddedWallet(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

/** Get the stored wallet address (without decrypting the key) */
export function getEmbeddedAddress(): string | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return (JSON.parse(raw) as StoredWallet).address;
  } catch {
    return null;
  }
}

/** Create a new embedded wallet, encrypt it with a password, and store it */
export async function createEmbeddedWallet(password: string): Promise<{ address: string; privateKey: string }> {
  const { ethers } = await import("ethers");
  const wallet = ethers.Wallet.createRandom();
  const { encrypted, salt, iv } = await encryptPrivateKey(wallet.privateKey, password);

  const stored: StoredWallet = {
    address: wallet.address,
    encryptedKey: encrypted,
    salt,
    iv,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  localStorage.setItem("ethcc-wallet-address", wallet.address);

  return { address: wallet.address, privateKey: wallet.privateKey };
}

/** Unlock an existing embedded wallet and return a WalletConnection */
export async function connectEmbeddedWallet(password: string): Promise<WalletConnection> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) throw new Error("No embedded wallet found");

  const stored: StoredWallet = JSON.parse(raw);
  const privateKey = await decryptPrivateKey(stored, password);

  const { ethers } = await import("ethers");
  const provider = new ethers.JsonRpcProvider(CHAIN_CONFIG.RPC_URL, {
    chainId: CHAIN_CONFIG.CHAIN_ID,
    name: CHAIN_CONFIG.CHAIN_NAME,
  });
  const signer = new ethers.Wallet(privateKey, provider);
  const address = signer.address;

  localStorage.setItem("ethcc-wallet-address", address);

  const proxy = new ethers.Contract(CHAIN_CONFIG.SOFIA_PROXY, SofiaFeeProxyAbi, signer);
  const multiVault = new ethers.Contract(CHAIN_CONFIG.MULTIVAULT, MULTIVAULT_ABI, signer);

  return { provider, signer, proxy, multiVault, address, ethers };
}

/** Mark the private key as backed up by the user */
export function markBackupDone(): void {
  localStorage.setItem("ethcc-backup-done", "1");
}

/** Check if the user has acknowledged the backup */
export function isBackupDone(): boolean {
  return localStorage.getItem("ethcc-backup-done") === "1";
}

// needsUnlock removed — unused

/** Delete the embedded wallet from storage */
export function deleteEmbeddedWallet(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("ethcc-backup-done");
}
