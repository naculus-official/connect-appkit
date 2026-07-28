/**
 * useTransactionSimulation — React hook for simulating transactions
 *                           before signing/submitting.
 *
 * Provides a reactive SimulationResult that updates when tx parameters change.
 * Uses the simulation module from @naculus/connect-core.
 *
 * @see /docs/features/transaction-simulation.md
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useWeb3 } from "../provider/Web3ConnectProvider";
import { useAccount } from "./useAccount";
import { useChain } from "./useChain";
import { useViemClient } from "./useViemClient";

import type { EvmTransaction } from "../types";

// ── Types (mirrored from @naculus/connect-core simulation module) ──

export type SimulationStatus = "success" | "reverted" | "unavailable";

export type RiskLevel = "safe" | "warning" | "malicious" | "unknown";

export interface SimulationResult {
  status: SimulationStatus;
  revertReason?: string;
  balanceChanges: BalanceChange[];
  approvalChanges: ApprovalChange[];
  riskAssessment: RiskAssessment;
  gasInfo?: GasInfo;
  provider: string;
  summary?: string;
  changesDetected: boolean;
}

export interface BalanceChange {
  tokenAddress: string;
  tokenSymbol: string;
  tokenDecimals: number;
  amount: string;
  direction: "in" | "out";
  from: string;
  to: string;
  humanReadable: string;
}

export interface ApprovalChange {
  tokenAddress: string;
  tokenSymbol: string;
  owner: string;
  spender: string;
  amount: string;
  isUnlimited: boolean;
  humanReadable: string;
}

export interface RiskAssessment {
  level: RiskLevel;
  score: number;
  warnings: RiskWarning[];
}

export interface RiskWarning {
  category: string;
  severity: string;
  message: string;
}

export interface GasInfo {
  gasLimit: bigint;
  gasPrice?: bigint;
  estimatedFeeEth?: string;
  estimatedFeeUsd?: string;
}

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

// ── Default owner address for eth_call ────────────────────────────

function getNativeSymbol(chainId: number): string {
  const ethChains = [1, 5, 11155111, 10, 42161, 421614, 8453, 84532];
  const maticChains = [137, 80002];
  const bnbChains = [56, 97];

  if (ethChains.includes(chainId)) return "ETH";
  if (maticChains.includes(chainId)) return "MATIC";
  if (bnbChains.includes(chainId)) return "BNB";
  return "ETH";
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── Core simulation logic ───────────────────────────────────────

  const simulate = useCallback(async (): Promise<SimulationResult> => {
    if (!tx) {
      const noTxResult: SimulationResult = {
        status: "unavailable" as SimulationStatus,
        balanceChanges: [],
        approvalChanges: [],
        riskAssessment: { level: "unknown" as RiskLevel, score: 0, warnings: [] },
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
      // Determine the target chain ID
      const targetChainId = chainId ?? currentChain?.id ?? 1;

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
            balanceChanges: [],
            approvalChanges: [],
            riskAssessment: { level: "unknown", score: 0, warnings: [] },
            gasInfo: tx.gas
              ? { gasLimit: BigInt(tx.gas), estimatedFeeEth: "0" }
              : undefined,
            provider: "eth_call",
            summary: "Transaction simulation succeeded (basic revert check only)",
            changesDetected: true,
          };
          setResult(simResult);
          return simResult;
        } catch (callErr: any) {
          // eth_call reverted — extract reason
          let revertReason: string | undefined;
          const errMsg = callErr?.message ?? String(callErr);
          const errData = callErr?.data ?? callErr?.cause?.data;

          // Try to extract human-readable revert reason
          if (errData && typeof errData === "string") {
            const clean = errData.startsWith("0x") ? errData.slice(2) : errData;
            if (clean.startsWith("08c379a0") && clean.length > 138) {
              // Error(string) — ABI decode
              const length = parseInt(clean.slice(72, 136), 16);
              if (length > 0) {
                const msgHex = clean.slice(136, 136 + length * 2);
                const bytes = new Uint8Array(length);
                for (let i = 0; i < length; i++) {
                  bytes[i] = parseInt(msgHex.slice(i * 2, i * 2 + 2), 16);
                }
                revertReason = new TextDecoder().decode(bytes);
              }
            } else if (clean.startsWith("4e487b71")) {
              revertReason = `Panic: Built-in failure`;
            }
          }

          if (!revertReason) {
            revertReason = errMsg.includes("revert")
              ? errMsg
              : "Transaction reverted";
          }

          const simResult: SimulationResult = {
            status: "reverted",
            revertReason,
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
