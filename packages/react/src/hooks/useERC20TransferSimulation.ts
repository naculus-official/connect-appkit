/**
 * useERC20TransferSimulation — React hook for simulating ERC-20 token
 *                              transfers before signing/submitting.
 *
 * Wraps useTransactionSimulation with ERC-20 transfer calldata building,
 * so callers only need the token, recipient, and amount.
 *
 * @see /docs/features/transaction-simulation.md
 */

import { useMemo } from "react";
import {
  useTransactionSimulation,
  type UseTransactionSimulationReturn,
  type SimulationResult,
} from "./useTransactionSimulation";
import { useAccount } from "./useAccount";
import { useChain } from "./useChain";
import type { TokenConfig } from "@naculus/connect-core";
import type { EvmTransaction } from "../types";

// ── Constants ─────────────────────────────────────────────────────

/**
 * ERC-20 transfer function selector (first 4 bytes of keccak256("transfer(address,uint256)"))
 * We use this to build minimal calldata without importing viem for this hook.
 */
const ERC20_TRANSFER_SELECTOR = "0xa9059cbb";

// ── Helper: Pad address to 32 bytes (left-padded zeros) ──────────

function padAddress(addr: string): string {
  const clean = addr.startsWith("0x") ? addr.slice(2) : addr;
  return clean.padStart(64, "0");
}

/**
 * Pad a hex value (bigint as hex) to 32 bytes (left-padded zeros).
 */
function padHex(value: string, bytes: number = 32): string {
  const clean = value.startsWith("0x") ? value.slice(2) : value;
  return clean.padStart(bytes * 2, "0");
}

/**
 * Convert a decimal-amount string to raw amount in smallest unit.
 * E.g. "1.50" with 6 decimals → "1500000" as decimal string.
 */
function parseUnits(amount: string, decimals: number): bigint {
  // Split on decimal point
  const [whole = "0", fraction = ""] = amount.split(".");
  const padded = fraction.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(whole + padded || "0");
}

// ── Build ERC-20 transfer calldata ────────────────────────────────

/**
 * Build minimal ERC-20 transfer calldata without viem dependency.
 *
 * selector: 0xa9059cbb
 * args:     (address to, uint256 amount)
 * encoding: abi-encoded as two 32-byte words
 *
 * @param to   - Recipient address
 * @param amount - Raw transfer amount (smallest unit)
 */
function buildTransferCalldata(
  to: `0x${string}`,
  amount: bigint,
): `0x${string}` {
  return `${ERC20_TRANSFER_SELECTOR}${padAddress(to)}${padHex(amount.toString(16))}` as `0x${string}`;
}

// ── Types ─────────────────────────────────────────────────────────

export interface UseERC20TransferSimulationOptions {
  /** Token configuration (address, decimals, chainId) */
  token: TokenConfig;
  /** Recipient address */
  to: `0x${string}`;
  /** Amount in human-readable units (e.g. "1.50" for 1.5 USDC) */
  amount: string;
}

export interface UseERC20TransferSimulationReturn
  extends Omit<UseTransactionSimulationReturn, "simulate"> {
  /** Simulation result for the built ERC-20 transfer */
  result: SimulationResult | undefined;
  /** Whether a simulation is in progress */
  isSimulating: boolean;
  /** Error from the last simulation attempt */
  error: Error | null;
  /** Re-run the simulation with current parameters */
  reSimulate: () => Promise<SimulationResult>;
  /** Reset simulation state */
  reset: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────

export function useERC20TransferSimulation(
  options: UseERC20TransferSimulationOptions,
): UseERC20TransferSimulationReturn {
  const { evmAccount, isConnected } = useAccount();
  const { currentChain } = useChain();
  const chainId = options.token.chainId ?? currentChain?.id ?? 1;

  // Build the transaction descriptor from ERC-20 transfer params
  const tx: EvmTransaction | undefined = useMemo(() => {
    if (!isConnected || !evmAccount) return undefined;

    try {
      const decimals = options.token.decimals ?? 18;
      const rawAmount = parseUnits(options.amount, decimals);
      const data = buildTransferCalldata(options.to, rawAmount);

      return {
        to: options.token.address,
        data,
        value: "0",
      };
    } catch {
      // If amount parsing fails, return undefined
      return undefined;
    }
  }, [
    options.token.address,
    options.token.decimals,
    options.to,
    options.amount,
    evmAccount,
    isConnected,
  ]);

  // Use the base transaction simulation hook
  const sim = useTransactionSimulation(tx, chainId);

  // Alias simulate → reSimulate for semantic clarity
  return {
    result: sim.result,
    isSimulating: sim.isSimulating,
    error: sim.error,
    reSimulate: sim.simulate,
    reset: sim.reset,
  };
}
