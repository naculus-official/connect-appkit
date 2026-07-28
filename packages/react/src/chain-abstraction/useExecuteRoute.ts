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

import { useState, useCallback, useRef } from "react";
// ── Local type definitions (hook domain types, not core exports) ──────

export interface Quote {
  routeId: string;
  provider: string;
  totalCost?: bigint;
  estimatedTimeMs?: number;
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
  /** Execute a route (call this with the selected quote) */
  execute: (quote: Quote, recipient: string, options?: ExecuteOptions) => Promise<void>;
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
  executeRouteFn?: (quote: Quote, recipient: string, options?: ExecuteOptions) => Promise<ExecuteRouteResult>,
): UseExecuteRouteReturn {
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<ExecuteRouteResult | null>(null);
  const [error, setError] = useState<ExecuteError | null>(null);
  const mountedRef = useRef(true);

  const execute = useCallback(async (
    quote: Quote,
    recipient: string,
    options?: ExecuteOptions,
  ) => {
    if (!executeRouteFn) {
      setError({
        code: "no_executor",
        message: "No executeRoute function provided",
      });
      return;
    }

    setExecuting(true);
    setError(null);
    setResult(null);

    try {
      const execResult = await executeRouteFn(quote, recipient, options);

      if (mountedRef.current) {
        setResult(execResult);
      }
    } catch (err) {
      if (mountedRef.current) {
        const executionError = err as Error;
        setError({
          code: (executionError as any).code ?? "execution_failed",
          message: executionError.message,
          details: (executionError as any).details,
        });
      }
    } finally {
      if (mountedRef.current) {
        setExecuting(false);
      }
    }
  }, [executeRouteFn]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setExecuting(false);
  }, []);

  return { execute, executing, result, error, reset };
}
