import { chainNumber } from "../core/chain-selection";
import { WalletError } from "@naculus/connect-core";
/**
 * useTransactionSimulation — React hook for simulating transactions
 *                           before signing/submitting.
 *
 * Provides a reactive SimulationResult that updates when tx parameters change.
 * Uses the simulation module from @naculus/connect-core.
 *
 * @see /docs/features/transaction-simulation.md
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { resolveRevertReason } from "../core/revert-reason";
import { useWeb3 } from "../provider/Web3ConnectProvider";
import type { EvmTransaction } from "../types";
import { useAccount } from "./useAccount";
import { useChain } from "./useChain";
import { useViemClient } from "./useViemClient";

// ── Types ─────────────────────────────────────────────────────────
//
// Re-exported from the engine rather than mirrored. The local copies were not
// merely duplicates: every constrained type had been widened, so an address
// field accepted any string, a risk severity accepted any string — costing a
// consumer's switch its exhaustiveness check — and `tokenDecimals` could not
// express "unknown", which forces the caller to guess a precision. Importing
// them means a future divergence is a compile error instead of something
// found by diffing two files.

export type {
  ApprovalChange,
  BalanceChange,
  GasInfo,
  RiskAssessment,
  RiskLevel,
  RiskWarning,
  SimulationResult,
  SimulationStatus,
} from "@naculus/wallet-engine";

import type {
  RiskLevel,
  SimulationResult,
  SimulationStatus,
} from "@naculus/wallet-engine";

// ── Hook return type ──────────────────────────────────────────────

export interface UseTransactionSimulationReturn {
  /** Current simulation result (undefined until first run) */
  result: SimulationResult | undefined;
  /** Whether a simulation is in progress */
  isSimulating: boolean;
  /** Error from the last simulation attempt */
  error: Error | null;
  /** Manually trigger a simulation */
  simulate: () => Promise<SimulationResult>;
  /** Reset the simulation state */
  reset: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────

export function useTransactionSimulation(
  tx: EvmTransaction | undefined,
  chainId?: number,
): UseTransactionSimulationReturn {
  const { session } = useWeb3();
  const { evmAccount, isConnected } = useAccount();
  const { currentChain } = useChain();
  const { publicClient } = useViemClient();

  const [result, setResult] = useState<SimulationResult | undefined>(undefined);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Debounce ref to avoid rapid re-simulations
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // ── Core simulation logic ───────────────────────────────────────

  const simulate = useCallback(async (): Promise<SimulationResult> => {
    if (!tx) {
      const noTxResult: SimulationResult = {
        status: "unavailable" as SimulationStatus,
        // This hook runs an eth_call: it learns whether the transaction

        // reverts, not what moved. Saying so keeps a UI from rendering an

        // empty array as "no changes".

        coverage: {
          balanceChanges: false,
          approvalChanges: false,
          risk: false,
        },

        balanceChanges: [],
        approvalChanges: [],
        riskAssessment: {
          level: "unknown" as RiskLevel,
          score: 0,
          warnings: [],
        },
        provider: "eth_call",
        summary: "No transaction to simulate",
        changesDetected: false,
      };
      setResult(noTxResult);
      return noTxResult;
    }

    setIsSimulating(true);
    setError(null);

    try {
      // No `?? 1`. A simulation run against the wrong chain previews a
      // different transaction than the one that will be sent — different
      // contract state, different gas, possibly a different contract at the
      // same address — which is worse than showing no preview at all.
      const targetChainId =
        chainId ??
        (currentChain ? (chainNumber(currentChain) ?? undefined) : undefined);
      if (targetChainId === undefined) {
        throw new WalletError(
          "invalid_chain",
          "No chain to simulate on. Connect a wallet or pass a chainId.",
        );
      }

      // Determine RPC URL from the current chain context
      const rpcUrl = currentChain?.rpcUrl;

      // If we have a viem publicClient, use it for eth_call simulation
      if (publicClient) {
        try {
          const from = evmAccount?.includes(":")
            ? (evmAccount.split(":").pop() as `0x${string}`)
            : evmAccount;

          const callParams: any = {
            to: tx.to as `0x${string}`,
            data: (tx.data ?? "0x") as `0x${string}`,
            value: tx.value ? BigInt(tx.value) : 0n,
          };

          if (from) {
            callParams.from = from as `0x${string}`;
          }

          await publicClient.call(callParams);

          // eth_call succeeded — transaction won't revert
          const simResult: SimulationResult = {
            status: "success",
            coverage: {
              balanceChanges: false,
              approvalChanges: false,
              risk: false,
            },

            balanceChanges: [],
            approvalChanges: [],
            riskAssessment: { level: "unknown", score: 0, warnings: [] },
            gasInfo: tx.gas
              ? { gasLimit: BigInt(tx.gas), estimatedFeeEth: "0" }
              : undefined,
            provider: "eth_call",
            summary:
              "Transaction simulation succeeded (basic revert check only)",
            changesDetected: true,
          };
          setResult(simResult);
          return simResult;
        } catch (callErr: any) {
          // eth_call reverted — extract reason
          const errMsg = callErr?.message ?? String(callErr);
          const errData = callErr?.data ?? callErr?.cause?.data;
          const revertReason = resolveRevertReason(errData, errMsg);

          const simResult: SimulationResult = {
            status: "reverted",
            revertReason,
            coverage: {
              balanceChanges: false,
              approvalChanges: false,
              risk: false,
            },

            balanceChanges: [],
            approvalChanges: [],
            riskAssessment: {
              level: "unknown",
              score: 0,
              warnings: [
                {
                  category: "simulation_failed",
                  severity: "high",
                  message: revertReason
                    ? `Transaction would revert: ${revertReason}`
                    : "Transaction would revert",
                },
              ],
            },
            provider: "eth_call",
            summary: revertReason
              ? `Transaction reverted: ${revertReason}`
              : "Transaction reverted",
            changesDetected: false,
          };
          setResult(simResult);
          return simResult;
        }
      }

      // Fallback: raw fetch eth_call
      if (rpcUrl) {
        try {
          const response = await fetch(rpcUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: Date.now(),
              method: "eth_call",
              params: [
                {
                  to: tx.to,
                  from: evmAccount?.includes(":")
                    ? evmAccount.split(":").pop()
                    : evmAccount,
                  data: tx.data ?? "0x",
                  value: tx.value ?? "0x0",
                },
                "latest",
              ],
            }),
          });

          const json: any = await response.json();

          if (json.error) {
            const simResult: SimulationResult = {
              status: "reverted",
              coverage: {
                balanceChanges: false,
                approvalChanges: false,
                risk: false,
              },

              balanceChanges: [],
              approvalChanges: [],
              riskAssessment: {
                level: "unknown",
                score: 0,
                warnings: [
                  {
                    category: "simulation_failed",
                    severity: "high",
                    message: `Transaction would revert: ${json.error.message}`,
                  },
                ],
              },
              provider: "eth_call",
              summary: "Transaction reverted",
              changesDetected: false,
            };
            setResult(simResult);
            return simResult;
          }

          const simResult: SimulationResult = {
            status: "success",
            coverage: {
              balanceChanges: false,
              approvalChanges: false,
              risk: false,
            },

            balanceChanges: [],
            approvalChanges: [],
            riskAssessment: { level: "unknown", score: 0, warnings: [] },
            provider: "eth_call",
            summary: "Transaction simulation succeeded",
            changesDetected: true,
          };
          setResult(simResult);
          return simResult;
        } catch (fetchErr: any) {
          // Network error
          const simResult: SimulationResult = {
            status: "unavailable",
            coverage: {
              balanceChanges: false,
              approvalChanges: false,
              risk: false,
            },

            balanceChanges: [],
            approvalChanges: [],
            riskAssessment: {
              level: "unknown",
              score: 0,
              warnings: [
                {
                  category: "simulation_failed",
                  severity: "medium",
                  message: `Network error: ${fetchErr?.message ?? "Unknown"}`,
                },
              ],
            },
            provider: "eth_call",
            summary: "Simulation unavailable due to network error",
            changesDetected: false,
          };
          setResult(simResult);
          return simResult;
        }
      }

      // No RPC URL available
      const simResult: SimulationResult = {
        status: "unavailable",
        coverage: {
          balanceChanges: false,
          approvalChanges: false,
          risk: false,
        },

        balanceChanges: [],
        approvalChanges: [],
        riskAssessment: {
          level: "unknown",
          score: 0,
          warnings: [
            {
              category: "simulation_failed",
              severity: "low",
              message: "No RPC URL or public client available for simulation",
            },
          ],
        },
        provider: "eth_call",
        summary: "Simulation unavailable: no RPC URL",
        changesDetected: false,
      };
      setResult(simResult);
      return simResult;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Simulation failed");
      setError(error);
      throw error;
    } finally {
      setIsSimulating(false);
    }
  }, [tx, chainId, currentChain, publicClient, evmAccount]);

  // ── Auto-simulate on tx change (debounced) ──────────────────────

  useEffect(() => {
    if (!tx) return;

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce: wait 300ms after last tx change before simulating
    debounceRef.current = setTimeout(() => {
      simulate().catch(() => {
        // Silently handle; errors are captured in state
      });
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [tx, simulate]);

  // ── Reset ───────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setResult(undefined);
    setError(null);
    setIsSimulating(false);
  }, []);

  return {
    result,
    isSimulating,
    error,
    simulate,
    reset,
  };
}
