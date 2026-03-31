import { Navigate } from "react-router-dom";
import { STORAGE_KEYS } from "../config/constants";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Protects routes that require a wallet to be connected.
 * Redirects to onboarding if no wallet is found in localStorage.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const walletAddress = localStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS);

  // No wallet connected → redirect to onboarding
  if (!walletAddress) {
    return <Navigate to="/" replace />;
  }

  // Wallet connected → render the protected page
  return <>{children}</>;
}
