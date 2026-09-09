/**
 * useExecuteRoute — React hook for executing cross-chain routes.
 *
 * Manages the execution lifecycle of a cross-chain transfer.
 * Tracks execution status, bridge reference, and completion state.
 *
 * @example
 * ```tsx
 * import { useExecuteRoute } from "@naculus/connect-appkit-react";
 *
 * function RouteExecutionPanel({ quote }) {
 *   const { execute, executing, result, error } = useExecuteRoute();
 *
 *   return (
 *     <div>
 *       <button onClick={() => execute(quote, "0xRecipient")} disabled={executing}>
 *         {executing ? "Executing..." : "Execute Route"}
 *       </button>
 *       {result && <div>Tx: {result.fromTxHash}</div>}
 *       {error && <div>Error: {error.message}</div>}
 *     </div>
 *   );
 * }
 * ```
 */

import { isValidAddress } from "@naculus/connect-core";
import { useCallback, useEffect, useRef, useState } from "react";
// ── Local type definitions (hook domain types, not core exports) ──────

export interface Quote {
  routeId: string;
  provider: string;
  totalCost?: bigint;
  estimatedTimeMs?: number;
  /**
   * CAIP-2 chain the funds arrive on.
   *
   * Optional, and the only thing that makes `recipient` checkable. Without it
   * this hook cannot know whether "0x…" or a base58 string is the right shape,
   * so it does not guess — an EVM-looking check here would reject every
   * legitimate Solana and XRPL recipient. Supply it and the recipient is
   * validated for that namespace before anything is sent.
   *
   * Note that `Quote` as exported from the package root is `useRouteQuote`'s
   * type, which has different fields. A quote from that hook satisfies this
   * one structurally, so `totalCost` and `estimatedTimeMs` arrive undefined
   * and `toChain` has to be supplied by the caller.
   */
  toChain?: string;
}

export interface ExecuteRouteResult {
  fromTxHash: string;
  toTxHash?: string;
}

export interface ExecuteOptions {
  timeoutMs?: number;
  gasLimit?: bigint;
}

export interface UseExecuteRouteReturn {
  /**
   * Execute a route. Resolves with the result, or null if it failed.
   *
   * The result is returned as well as stored because `result` on this object
   * belongs to the render that produced it: a caller awaiting `execute` cannot
   * read it, and for a cross-chain transfer "did the funds move" is not a
   * question to answer on the next render.
   */
  execute: (
    quote: Quote,
    recipient: string,
    options?: ExecuteOptions,
  ) => Promise<ExecuteRouteResult | null>;
  /** Whether execution is in progress */
  executing: boolean;
  /** The execution result (populated after successful execution) */
  result: ExecuteRouteResult | null;
  /** Error that occurred during execution */
  error: ExecuteError | null;
  /** Reset execution state back to initial */
  reset: () => void;
}

export interface ExecuteError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Hook for executing a cross-chain route.
 *
 * Manages the full lifecycle from calling executeRoute to
 * tracking the result. For auto-approve flows, handles the
 * approve → cross-chain sequence.
 *
 * @param executeRouteFn - Function that performs the actual route execution
 */
export function useExecuteRoute(
  executeRouteFn?: (
    quote: Quote,
    recipient: string,
    options?: ExecuteOptions,
  ) => Promise<ExecuteRouteResult>,
): UseExecuteRouteReturn {
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<ExecuteRouteResult | null>(null);
  const [error, setError] = useState<ExecuteError | null>(null);
  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);

  // The guard below is only meaningful if something clears this. The ref was
  // initialised to true and never set false, so every `if (mountedRef.current)`
  // was dead code and the hook wrote state after unmount anyway.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (
      quote: Quote,
      recipient: string,
      options?: ExecuteOptions,
    ): Promise<ExecuteRouteResult | null> => {
      if (!executeRouteFn) {
        setError({
          code: "no_executor",
          message: "No executeRoute function provided",
        });
        // Clear any earlier success too. A UI showing last run's transaction
        // hash next to this error reads as though something was sent.
        setResult(null);
        return null;
      }

      // An empty recipient is wrong on every chain, so this costs nothing to
      // check and needs no knowledge of the destination namespace.
      if (typeof recipient !== "string" || recipient.trim() === "") {
        setError({
          code: "invalid_recipient",
          message: "A recipient address is required",
        });
        setResult(null);
        return null;
      }

      // Anything beyond that needs to know which chain the funds land on. When
      // the quote says, the address is validated for that namespace; when it
      // does not, this hook is not in a position to judge and lets the executor
      // decide rather than rejecting a valid non-EVM address.
      const namespace = quote?.toChain?.split(":")[0];
      if (namespace && !isValidAddress(recipient, namespace)) {
        setError({
          code: "invalid_recipient",
          message: `"${recipient}" is not a valid ${namespace} address for the destination chain ${quote.toChain}`,
        });
        setResult(null);
        return null;
      }

      // A cross-chain transfer must not be submitted twice because a button was
      // pressed twice. Matches useSendUserOperation.
      if (inFlightRef.current) {
        setError({
          code: "execution_in_progress",
          message: "A route execution is already in progress",
        });
        return null;
      }

      inFlightRef.current = true;
      setExecuting(true);
      setError(null);
      setResult(null);

      try {
        const execResult = await executeRouteFn(quote, recipient, options);

        if (mountedRef.current) {
          setResult(execResult);
        }
        return execResult;
      } catch (err) {
        const executionError = err as Error;
        if (mountedRef.current) {
          setError({
            code:
              (executionError as { code?: string }).code ?? "execution_failed",
            message: executionError.message,
            details: (executionError as { details?: Record<string, unknown> })
              .details,
          });
        }
        return null;
      } finally {
        inFlightRef.current = false;
        if (mountedRef.current) {
          setExecuting(false);
        }
      }
    },
    [executeRouteFn],
  );

  const reset = useCallback(() => {
    // Deliberately does not clear inFlightRef: a request already sent to the
    // executor is still out there, and letting reset() unlock the guard would
    // permit exactly the double submission it exists to prevent.
    setResult(null);
    setError(null);
    setExecuting(false);
  }, []);

  return { execute, executing, result, error, reset };
}
