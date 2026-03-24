/**
 * Send $TRUST transaction logic — extracted from SendPage.
 */

import { useState, useCallback } from "react";
import { STORAGE_KEYS } from "../config/constants";
import { connectWallet } from "../services/intuition";
import { useEmbeddedWallet } from "../contexts/EmbeddedWalletContext";
import { formatTxError } from "../utils/txErrors";
import type { WalletConnection } from "../services/intuition";

type TxState = "idle" | "connecting" | "sending" | "success" | "error";

export function useSendTransaction() {
  const embeddedCtx = useEmbeddedWallet();

  const [txState, setTxState] = useState<TxState>("idle");
  const [txHash, setTxHash] = useState("");
  const [txError, setTxError] = useState("");
  const [balance, setBalance] = useState<string | null>(null);

  const send = useCallback(async (recipient: string, amount: string) => {
    setTxState("connecting");
    setTxError("");
    setTxHash("");

    let connection: WalletConnection;
    try {
      if (embeddedCtx.wallet) {
        connection = embeddedCtx.wallet;
      } else {
        connection = await connectWallet();
      }
      const bal = await connection.provider.getBalance(connection.address);
      const formatted = connection.ethers.formatEther(bal);
      setBalance(formatted);

      const sendAmount = connection.ethers.parseEther(amount);
      if (sendAmount > bal) {
        setTxError(`Insufficient balance: ${parseFloat(formatted).toFixed(4)} TRUST available`);
        setTxState("error");
        return;
      }
    } catch (e: unknown) {
      setTxError(formatTxError(e));
      setTxState("error");
      return;
    }

    setTxState("sending");
    try {
      const tx = await connection.signer.sendTransaction({
        to: recipient,
        value: connection.ethers.parseEther(amount),
      });

      setTxHash(tx.hash);
      setTxState("success");

      try {
        const transfers = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSFERS) ?? "[]");
        transfers.push({ from: connection.address, to: recipient, amount, hash: tx.hash, timestamp: Date.now() });
        localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(transfers));
      } catch { /* ignore */ }

      const newBal = await connection.provider.getBalance(connection.address);
      setBalance(connection.ethers.formatEther(newBal));
    } catch (e: unknown) {
      setTxError(formatTxError(e));
      setTxState("error");
    }
  }, [embeddedCtx.wallet]);

  const reset = useCallback(() => {
    setTxState("idle");
    setTxHash("");
    setTxError("");
  }, []);

  return { txState, txHash, txError, balance, send, reset };
}
