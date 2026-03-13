import { QRCodeSVG } from "qrcode.react";
import type { WalletStep as WalletStepType } from "../../hooks/useWallet";

interface WalletStepProps {
  step: WalletStepType;
  walletAddress: string;
  trustBalance: string | null;
  txStatus: string;
  txError: string;
  tripleCount: number;
  onConnect: () => void;
  onCreate: () => void;
  onAddChain: () => void;
  onBack: () => void;
}

export function WalletStep({
  step,
  walletAddress,
  trustBalance,
  txStatus,
  txError,
  tripleCount,
  onConnect,
  onCreate,
  onAddChain,
  onBack,
}: WalletStepProps) {
  return (
    <div className="wallet-page">
      <div className="profile-header">
        <h1 className="profile-title">
          {walletAddress ? "Get $TRUST tokens" : "Connect your wallet"}
        </h1>
        <p className="profile-subtitle">
          {walletAddress
            ? "Ask someone to scan your QR code and send you $TRUST to pay for the on-chain transaction."
            : "Connect your wallet to publish your profile on Intuition."
          }
        </p>
      </div>

      {/* QR Code — disabled placeholder */}
      {!walletAddress && (
        <div className="qr-container">
          <div className="qr-wrapper qr-disabled">
            <QRCodeSVG
              value="0x0000000000000000000000000000000000000000"
              size={200}
              bgColor="transparent"
              fgColor="#4a5568"
              level="M"
            />
          </div>
          <p className="qr-label">Connect your wallet to receive $TRUST</p>
        </div>
      )}

      {/* QR Code — active, waiting for $TRUST */}
      {walletAddress && trustBalance !== null && parseFloat(trustBalance) === 0 && (
        <div className="qr-container">
          <div className="qr-wrapper">
            <QRCodeSVG
              value={walletAddress}
              size={200}
              bgColor="transparent"
              fgColor="#ffffff"
              level="M"
            />
          </div>
          <p className="qr-label">Scan to send $TRUST to your wallet</p>
          <p className="qr-address">{walletAddress}</p>
          <p className="qr-waiting">Waiting for $TRUST...</p>
        </div>
      )}

      {/* $TRUST received */}
      {walletAddress && trustBalance !== null && parseFloat(trustBalance) > 0 && (
        <div className="trust-received">
          <div className="trust-received-check">&#10003;</div>
          <p className="trust-received-label">$TRUST received!</p>
          <p className="trust-received-amount">
            {parseFloat(trustBalance).toFixed(4)} $TRUST
          </p>
        </div>
      )}

      {txError && <div className="tx-error">{txError}</div>}

      <div className="profile-cta profile-cta-stack">
        {!walletAddress && (
          <>
            <button
              className="profile-create-btn wallet-connect-btn"
              disabled={!!txStatus}
              onClick={onConnect}
            >
              {txStatus || "Connect Wallet"}
            </button>
            <button
              className="profile-secondary-btn"
              onClick={onAddChain}
            >
              Add Intuition Chain
            </button>
          </>
        )}
        {walletAddress && (
          <button
            className="profile-create-btn"
            disabled={step === "signing"}
            onClick={onCreate}
          >
            {step === "signing" ? txStatus : `Create my profile (${tripleCount} triples)`}
          </button>
        )}
        {step !== "signing" && (
          <button className="profile-back-btn" onClick={onBack}>
            &larr; Back to recap
          </button>
        )}
      </div>
    </div>
  );
}
