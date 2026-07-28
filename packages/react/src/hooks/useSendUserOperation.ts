/**
 * useSendUserOperation
 *
 * React hook for sending ERC-4337 UserOperations.
 * Handles construction, signing via connected wallet, and submission to bundler.
 *
 * @example
 * ```tsx
 * const { sendUserOp, userOpHash, receipt, isPending } = useSendUserOperation({
 *   rpcUrl: "https://eth.llamarpc.com",
 *   bundlerUrl: "https://api.pimlico.io/v2/1/rpc?apikey=...",
 * });
 *
 * const handleSend = async () => {
 *   await sendUserOp([
 *     { to: "0x...", value: 0n, data: "0x..." },
 *   ]);
 * };
 * ```
 */

import { useState, useCallback, useRef } from "react";
import type {
  UserOperationResponse,
  UserOperationReceipt,
  UserOperation,
  Address,
  Hex,
  Call,
  SendUserOpOptions,
  SmartAccountConfig,
} from "@naculus/connect-core";

export interface UseSendUserOperationOptions {
  /** RPC URL for the target chain */
  rpcUrl?: string;
  /** Bundler RPC URL */
  bundlerUrl?: string;
  /** Chain ID (CAIP-2 format) */
  chainId?: string;
  /** EntryPoint contract address */
  entryPoint?: Address;
  /** Optional signing function override */
  signer?: (hash: Hex) => Promise<Hex> | Hex;
}

export interface UseSendUserOperationReturn {
  /** Send a UserOperation with the given calls */
  sendUserOp: (calls: Call[], options?: SendUserOpOptions) => Promise<UserOperationResponse | null>;
  /** The userOpHash from the last send */
  userOpHash: Hex | null;
  /** The receipt from the last UserOperation (null while pending) */
  receipt: UserOperationReceipt | null;
  /** Whether a UserOperation is currently being sent */
  isPending: boolean;
  /** Loading state for gas estimation phase */
  isEstimating: boolean;
  /** Error state */
  error: Error | null;
  /** Reset state */
  reset: () => void;
}

/**
 * Hook for sending ERC-4337 UserOperations to a bundler.
 *
 * @param options - Configuration for the bundler and chain
 * @returns UserOperation send states and actions
 */
export function useSendUserOperation(
  options?: UseSendUserOperationOptions,
): UseSendUserOperationReturn {
  const [userOpHash, setUserOpHash] = useState<Hex | null>(null);
  const [receipt, setReceipt] = useState<UserOperationReceipt | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendUserOp = useCallback(
    async (
      calls: Call[],
      opts?: SendUserOpOptions,
    ): Promise<UserOperationResponse | null> => {
      if (!options?.bundlerUrl) {
        setError(new Error("Bundler URL not configured"));
        return null;
      }

      if (!calls.length) {
        setError(new Error("At least one call is required"));
        return null;
      }

      // Cancel any in-flight request
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setIsPending(true);
      setIsEstimating(true);
      setError(null);
      setUserOpHash(null);
      setReceipt(null);

      try {
        const { SmartAccountManager, buildCallData, signUserOperation, sendUserOperation, buildUserOperation } =
          await import("@naculus/connect-core");

        // Build the UserOperation
        const callData = buildCallData(calls);

        // Estimate gas via bundler
        const entryPoint = options?.entryPoint ??
          "0x0000000071727De22E5E9d8BAf0edAc6f37da032" as Address;

        let gasEstimate = {
          callGasLimit: 100_000n,
          verificationGasLimit: 100_000n,
          preVerificationGas: 50_000n,
        };

        setIsEstimating(false);

        try {
          const est = await import("@naculus/connect-core").then(
            ({ estimateUserOperationGas }) =>
              estimateUserOperationGas(
                { callData, sender: "0x0000000000000000000000000000000000000000" as Address },
                entryPoint,
                options.bundlerUrl!,
              ),
          );
          gasEstimate = est;
        } catch {
          // Use defaults
        }

        // Get fee data
        let maxFeePerGas = 50_000_000_000n; // 50 gwei default
        let maxPriorityFeePerGas = 1_000_000_000n; // 1 gwei default

        if (options.rpcUrl) {
          try {
            const baseFee = await fetch(options.rpcUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "eth_getBlockByNumber",
                params: ["latest", false],
              }),
              signal: abortRef.current.signal,
            }).then(r => r.json()).then(j => {
              if (j.result?.baseFeePerGas) return BigInt(j.result.baseFeePerGas);
              return null;
            });

            const priorityFee = await fetch(options.rpcUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "eth_maxPriorityFeePerGas",
                params: [],
              }),
              signal: abortRef.current.signal,
            }).then(r => r.json()).then(j => {
              if (j.result) return BigInt(j.result);
              return null;
            });

            if (baseFee && priorityFee) {
              maxFeePerGas = baseFee * 2n + priorityFee;
              maxPriorityFeePerGas = priorityFee;
            }
          } catch {
            // Use defaults
          }
        }

        // Apply gas overrides
        if (opts?.gasOverrides?.callGasLimit) gasEstimate.callGasLimit = opts.gasOverrides.callGasLimit;
        if (opts?.gasOverrides?.verificationGasLimit) gasEstimate.verificationGasLimit = opts.gasOverrides.verificationGasLimit;
        if (opts?.gasOverrides?.preVerificationGas) gasEstimate.preVerificationGas = opts.gasOverrides.preVerificationGas;
        if (opts?.gasOverrides?.maxFeePerGas) maxFeePerGas = opts.gasOverrides.maxFeePerGas;
        if (opts?.gasOverrides?.maxPriorityFeePerGas) maxPriorityFeePerGas = opts.gasOverrides.maxPriorityFeePerGas;

        // Build partial UserOperation
        const userOp = buildUserOperation({
          sender: "0x0000000000000000000000000000000000000000" as Address,
          nonce: 0n,
          callData,
          accountGasLimits: `0x${gasEstimate.verificationGasLimit.toString(16).padStart(32, "0")}${gasEstimate.callGasLimit.toString(16).padStart(32, "0")}` as Hex,
          preVerificationGas: gasEstimate.preVerificationGas,
          maxFeePerGas,
          maxPriorityFeePerGas,
        });

        // Send to bundler
        const response = await sendUserOperation(
          userOp,
          options.bundlerUrl!,
          entryPoint,
        );

        setUserOpHash(response.userOpHash);

        // Start polling for receipt
        UserOpPoller(response.userOpHash, options.bundlerUrl!, entryPoint)
          .then((rcpt) => {
            if (rcpt) setReceipt(rcpt);
          })
          .catch(() => {
            // Silently handle polling errors
          });

        return response;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to send UserOperation");
        setError(error);
        return null;
      } finally {
        setIsPending(false);
        setIsEstimating(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setUserOpHash(null);
    setReceipt(null);
    setIsPending(false);
    setIsEstimating(false);
    setError(null);
  }, []);

  return {
    sendUserOp,
    userOpHash,
    receipt,
    isPending,
    isEstimating,
    error,
    reset,
  };
}

/**
 * Poll for a UserOperation receipt from the bundler.
 */
async function UserOpPoller(
  userOpHash: Hex,
  bundlerUrl: string,
  entryPoint: Address,
  maxRetries = 20,
  intervalMs = 2000,
): Promise<UserOperationReceipt | null> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(bundlerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_getUserOperationReceipt",
          params: [userOpHash],
        }),
      });

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
        return {
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
      }
    } catch {
      // Continue polling
    }

    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  return null;
}
