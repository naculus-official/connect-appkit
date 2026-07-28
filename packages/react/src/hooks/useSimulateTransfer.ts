/**
 * useSimulateTransfer — React hook for simulating ERC-20 token transfers.
 *
 * Wraps SimulationManager.simulateERC20Transfer in a React hook with
 * reactive state for loading, result, and error.
 *
 * @example
 * ```tsx
 * import { useSimulateTransfer } from "@naculus/connect-appkit-react";
 *
 * function SendForm({ token, to, amount }) {
 *   const { result, simulate, loading } = useSimulateTransfer({
 *     rpcUrl: "https://eth.llamarpc.com",
 *   });
 *
 *   return (
 *     <div>
 *       <button onClick={() => simulate(token, to, amount)} disabled={loading}>
 *         Simulate Transfer
 *       </button>
 *       {result && <p>Result: {result.status}</p>}
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useCallback, useRef } from "react";
import { SimulationManager } from "@naculus/wallet-engine";
import type { SimulationResult } from "@naculus/wallet-engine";

// ── Types ──────────────────────────────────────────────────────────

export interface UseSimulateTransferOptions {
  /** RPC URL for eth_call simulation */
  rpcUrl?: string;
  /** Default chain ID */
  chainId?: number;
}

export interface UseSimulateTransferReturn {
  /** Current simulation result */
  result: SimulationResult | null;
  /** Whether a simulation is in progress */
  loading: boolean;
  /** Last error (null if no error) */
  error: Error | null;
  /**
   * Simulate an ERC-20 transfer.
   *
   * @param tokenAddress - ERC-20 token contract address
   * @param from - Sender address
   * @param to - Recipient address
   * @param amount - Human-readable amount (e.g. "1.50")
   * @param options - Optional chainId, rpcUrl, decimals override
   */
  simulate: (
    tokenAddress: `0x${string}`,
    from: `0x${string}`,
    to: `0x${string}`,
    amount: string,
    options?: {
      chainId?: number;
      rpcUrl?: string;
      decimals?: number;
    },
  ) => Promise<SimulationResult>;
  /** Reset result and error state */
  reset: () => void;
}

// ── Hook ───────────────────────────────────────────────────────────

/**
 * Hook for simulating an ERC-20 token transfer.
 *
 * Creates a SimulationManager internally and provides a `simulate`
 * function that builds transfer calldata automatically.
 *
 * @param options - Configuration for the underlying SimulationManager
 */
export function useSimulateTransfer(
  options?: UseSimulateTransferOptions,
): UseSimulateTransferReturn {
  const rpcUrl = options?.rpcUrl;
  const chainId = options?.chainId;

  // ── SimulationManager ref (lazy init) ──────────────────────────

  const managerRef = useRef<SimulationManager | null>(null);

  function getManager(): SimulationManager {
    if (!managerRef.current) {
      managerRef.current = new SimulationManager({
        enabled: true,
        rpcUrl,
        autoSimulate: false,
      });
    }
    return managerRef.current;
  }

  // ── State ──────────────────────────────────────────────────────

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // ── Simulate ───────────────────────────────────────────────────

  const simulate = useCallback(
    async (
      tokenAddress: `0x${string}`,
      from: `0x${string}`,
      to: `0x${string}`,
      amount: string,
      simOptions?: {
        chainId?: number;
        rpcUrl?: string;
        decimals?: number;
      },
    ): Promise<SimulationResult> => {
      setLoading(true);
      setError(null);

      try {
        const manager = getManager();
        const actualChainId = simOptions?.chainId ?? chainId ?? 1;
        const actualRpcUrl = simOptions?.rpcUrl ?? rpcUrl;

        const simResult = await manager.simulateERC20Transfer(
          tokenAddress,
          from,
          to,
          amount,
          actualChainId,
          simOptions?.decimals,
        );

        setResult(simResult);
        return simResult;
      } catch (err) {
        const errorObj =
          err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    [rpcUrl, chainId],
  );

  // ── Reset ──────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setLoading(false);
  }, []);

  // ── Return ─────────────────────────────────────────────────────

  return { result, loading, error, simulate, reset };
}
