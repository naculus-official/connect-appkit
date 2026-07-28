/**
 * useUserOpStatus
 *
 * React hook for tracking ERC-4337 UserOperation lifecycle.
 * Polls the bundler for UserOperation receipt and reports status transitions.
 *
 * @example
 * ```tsx
 * const { userOpHash, status, receipt, error } = useUserOpStatus({
 *   userOpHash: "0x...",
 *   bundlerUrl: "https://api.pimlico.io/v2/1/rpc?apikey=...",
 *   pollInterval: 2000,
 * });
 *
 * if (status === "confirmed") {
 *   console.log("UserOp included in block!");
 * }
 * ```
 */

import { useState, useEffect, useRef, useCallback } from "react";
import type {
  UserOperationReceipt,
  Address,
  Hex,
} from "@naculus/connect-core";

export type UserOpStatus = "idle" | "pending" | "confirmed" | "failed" | "not_found";

export interface UseUserOpStatusOptions {
  /** The UserOperation hash to track */
  userOpHash?: Hex | null;
  /** Bundler RPC URL */
  bundlerUrl?: string;
  /** Polling interval in milliseconds (default: 2000) */
  pollInterval?: number;
  /** Maximum number of retries (default: 30) */
  maxRetries?: number;
  /** Auto-start polling when userOpHash is provided */
  autoStart?: boolean;
}

export interface UseUserOpStatusReturn {
  /** Current status of the UserOperation */
  status: UserOpStatus;
  /** UserOperation receipt (available when confirmed or failed) */
  receipt: UserOperationReceipt | null;
  /** The userOpHash being tracked */
  userOpHash: Hex | null;
  /** Error state */
  error: Error | null;
  /** Whether polling is active */
  isPolling: boolean;
  /** Time elapsed since tracking started (ms) */
  elapsedMs: number;
  /** Number of poll attempts made */
  attempts: number;
  /** Start tracking a UserOperation */
  start: (hash: Hex) => void;
  /** Stop tracking */
  stop: () => void;
  /** Reset state */
  reset: () => void;
}

/**
 * Hook for tracking the lifecycle of an ERC-4337 UserOperation.
 *
 * @param options - Configuration for polling behavior
 * @returns UserOperation status, receipt, and lifecycle controls
 */
export function useUserOpStatus(
  options?: UseUserOpStatusOptions,
): UseUserOpStatusReturn {
  const bundlerUrl = options?.bundlerUrl;
  const pollInterval = options?.pollInterval ?? 2000;
  const maxRetries = options?.maxRetries ?? 30;

  const [status, setStatus] = useState<UserOpStatus>("idle");
  const [receipt, setReceipt] = useState<UserOperationReceipt | null>(null);
  const [userOpHash, setUserOpHash] = useState<Hex | null>(options?.userOpHash ?? null);
  const [error, setError] = useState<Error | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const startTimeRef = useRef<number>(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  // Poll the bundler for receipt
  const poll = useCallback(async (hash: Hex) => {
    if (!bundlerUrl) return;

    try {
      const response = await fetch(bundlerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_getUserOperationReceipt",
          params: [hash],
        }),
      });

      if (!response.ok) return;

      const json = await response.json() as {
        result?: {
          userOpHash: Hex;
          entryPoint: Address;
          sender: Address;
          nonce: string;
          paymaster?: Address;
          actualGasUsed: string;
          actualGasCost: string;
          success: boolean;
          transactionHash: Hex;
          logs: Array<{ address: Address; topics: Hex[]; data: Hex }>;
        };
      };

      if (json.result) {
        const receiptData: UserOperationReceipt = {
          userOpHash: json.result.userOpHash,
          entryPoint: json.result.entryPoint,
          sender: json.result.sender,
          nonce: BigInt(json.result.nonce),
          paymaster: json.result.paymaster,
          actualGasUsed: BigInt(json.result.actualGasUsed),
          actualGasCost: BigInt(json.result.actualGasCost),
          success: json.result.success,
          transactionHash: json.result.transactionHash,
          logs: json.result.logs,
        };

        setReceipt(receiptData);
        setStatus(json.result.success ? "confirmed" : "failed");
        setIsPolling(false);
        clearTimers();

        return;
      }

      // No receipt yet; schedule next poll
      setAttempts(prev => prev + 1);
      setStatus("pending");

      if (attempts < maxRetries) {
        pollTimerRef.current = setTimeout(() => poll(hash), pollInterval);
      } else {
        setStatus("not_found");
        setIsPolling(false);
        clearTimers();
        setError(new Error("UserOperation not included after maximum retries"));
      }
    } catch {
      // Network error; retry
      setAttempts(prev => prev + 1);
      if (attempts < maxRetries) {
        pollTimerRef.current = setTimeout(() => poll(hash), pollInterval);
      }
    }
  }, [bundlerUrl, pollInterval, maxRetries, attempts, clearTimers]);

  // Start tracking
  const start = useCallback((hash: Hex) => {
    clearTimers();
    setUserOpHash(hash);
    setStatus("pending");
    setReceipt(null);
    setError(null);
    setAttempts(0);
    setIsPolling(true);
    startTimeRef.current = Date.now();

    // Start elapsed timer
    intervalRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 1000);

    // Start polling
    poll(hash);
  }, [clearTimers, poll]);

  // Stop tracking
  const stop = useCallback(() => {
    clearTimers();
    setIsPolling(false);
  }, [clearTimers]);

  // Reset state
  const reset = useCallback(() => {
    clearTimers();
    setUserOpHash(null);
    setStatus("idle");
    setReceipt(null);
    setError(null);
    setIsPolling(false);
    setAttempts(0);
    setElapsedMs(0);
  }, [clearTimers]);

  // Auto-start if userOpHash provided on mount
  useEffect(() => {
    if (options?.userOpHash && options?.autoStart !== false) {
      start(options.userOpHash);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return {
    status,
    receipt,
    userOpHash,
    error,
    isPolling,
    elapsedMs,
    attempts,
    start,
    stop,
    reset,
  };
}
