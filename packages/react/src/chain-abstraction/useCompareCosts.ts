/**
 * useCompareCosts — React hook for comparing operation costs across chains.
 *
 * Provides reactive state for comparing gas costs, fees, and estimated
 * times for a given operation across multiple chains.
 *
 * @example
 * ```tsx
 * import { useCompareCosts } from "@naculus/connect-appkit-react";
 *
 * function CostComparisonPanel() {
 *   const { comparisons, loading, error, refresh } = useCompareCosts({
 *     operation: "send_erc20",
 *     chains: ["eip155:1", "eip155:137", "eip155:10"],
 *   });
 *
 *   if (loading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       {comparisons.map(c => (
 *         <div key={c.chain}>
 *           {c.chainName}: ${c.totalCost} (gas: ${c.gasCost})
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */

import { useCallback, useEffect, useRef, useState } from "react";
// ── Local type definitions (hook domain types, not core exports) ──────

export interface CostComparison {
  chain: string;
  chainName: string;
  totalCost: string;
  gasCost: string;
  estimatedTimeMs: number;
}

export type CostComparisonOperation =
  | "send_erc20"
  | "swap"
  | "bridge"
  | (string & {});

export interface CostComparisonOptions {
  amount?: string;
  token?: string;
  [key: string]: unknown;
}

export interface UseCompareCostsInput {
  operation: CostComparisonOperation;
  chains: string[];
  options?: CostComparisonOptions;
}

export interface UseCompareCostsReturn {
  /** Sorted cost comparisons (cheapest first) */
  comparisons: CostComparison[];
  /** Whether a comparison request is in flight */
  loading: boolean;
  /** Error that occurred during the last request */
  error: Error | null;
  /** Manually trigger a refresh */
  refresh: () => Promise<void>;
}

/**
 * Hook for comparing operation costs across multiple chains.
 *
 * Automatically re-fetches when input parameters change.
 * Helpful for chain selection UIs ("show me the cheapest chain").
 *
 * @param input - Comparison parameters
 * @param compareCostsFn - Function that performs the actual comparison
 */
/**
 * Order-independent key for the options bag.
 *
 * JSON.stringify would make `{a,b}` and `{b,a}` different inputs and refetch
 * for nothing; it would also throw on a cyclic object a caller passed by
 * mistake, taking the render down with it.
 */
function stableOptionsKey(options: CostComparisonOptions | undefined): string {
  if (!options) return "";
  return Object.keys(options)
    .sort()
    .map((key) => {
      const value = options[key];
      return `${key}=${
        typeof value === "object" && value !== null ? "[object]" : String(value)
      }`;
    })
    .join("&");
}

export function useCompareCosts(
  input: UseCompareCostsInput,
  compareCostsFn?: (
    operation: string,
    chains: string[],
    options?: CostComparisonOptions,
  ) => Promise<CostComparison[]>,
): UseCompareCostsReturn {
  const { operation, chains, options } = input;
  const [comparisons, setComparisons] = useState<CostComparison[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);
  const generationRef = useRef(0);

  // `chains` is an array and `options` an object. Depending on them by
  // reference meant a caller writing the natural
  // `useCompareCosts({ operation, chains: ["eip155:1"] })` rebuilt both every
  // render, so this callback changed identity every render and the effect
  // below re-fired — an unbounded loop against a cost API. Key on the values.
  const inputKey = `${operation}|${(chains ?? []).join(",")}|${stableOptionsKey(options)}`;

  const fetchComparisons = useCallback(async () => {
    if (!chains || chains.length === 0) {
      setComparisons([]);
      return;
    }

    if (!compareCostsFn) return;

    // Only the newest request may write. A comparison for a previous chain set
    // resolving last would otherwise decide which route the user is shown as
    // cheapest, using costs for chains they are no longer looking at.
    const generation = ++generationRef.current;
    setLoading(true);
    setError(null);

    try {
      const result = await compareCostsFn(operation, chains, options);

      if (mountedRef.current && generation === generationRef.current) {
        setComparisons(result);
      }
    } catch (err) {
      if (mountedRef.current && generation === generationRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setComparisons([]);
      }
    } finally {
      if (mountedRef.current && generation === generationRef.current) {
        setLoading(false);
      }
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on inputKey by value; see the comment above.
  }, [inputKey, compareCostsFn]);

  useEffect(() => {
    fetchComparisons();
  }, [fetchComparisons]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    await fetchComparisons();
  }, [fetchComparisons]);

  return { comparisons, loading, error, refresh };
}
