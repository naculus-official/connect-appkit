/**
 * useSwitchChain Hook
 *
 * Provides the switchChain method with loading/error state tracking.
 *
 * @see SRS-009 §7.2
 */

import { useState, useCallback } from "react";
import { useWeb3 } from "../provider/Web3ConnectProvider";
import { WalletError } from "@naculus/connect-core";

export interface UseSwitchChainReturn {
  /** Switch the active chain for the current session */
  switchChain: (chainId: string) => Promise<void>;
  /** Whether a chain switch is in progress */
  isSwitching: boolean;
  /** The currently active chain ID */
  currentChainId: string | null;
  /** The last error that occurred during chain switch (if any) */
  error: Error | null;
  /** Clear the error state */
  clearError: () => void;
}

export function useSwitchChain(): UseSwitchChainReturn {
  const { switchChain: providerSwitchChain, chainId } = useWeb3();
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleSwitchChain = useCallback(
    async (targetChainId: string) => {
      setIsSwitching(true);
      setError(null);

      try {
        await providerSwitchChain(targetChainId);
      } catch (err) {
        const walletError =
          err instanceof WalletError
            ? err
            : new WalletError(
                "chain_unsupported",
                err instanceof Error
                  ? err.message
                  : "Unknown error during chain switch",
              );
        setError(walletError);
        throw walletError;
      } finally {
        setIsSwitching(false);
      }
    },
    [providerSwitchChain],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    switchChain: handleSwitchChain,
    isSwitching,
    currentChainId: chainId,
    error,
    clearError,
  };
}
