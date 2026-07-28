/**
 * useRouteQuote — React hook for cross-chain route quoting.
 *
 * Provides reactive state for discovering routes and getting quotes
 * from the RouteEngine. Returns loading, error, and result states.
 *
 * @example
 * ```tsx
 * import { useRouteQuote } from "@naculus/connect-appkit-react";
 *
 * function QuotePanel() {
 *   const { quotes, loading, error, refresh } = useRouteQuote({
 *     fromChain: "eip155:1",
 *     toChain: "eip155:137",
 *     fromToken: "USDC",
 *     amount: "1000000",
 *   });
 *
 *   if (loading) return <div>Loading quotes...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return (
 *     <div>
 *       {quotes.map(q => (
 *         <div key={q.routeId}>
 *           {q.provider} — {q.netReceiveFormatted} {q.toTokenSymbol}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback, useRef } from "react";
// ── Local type definitions (hook domain types, not core exports) ──────

export interface Quote {
  routeId: string;
  provider: string;
  netReceiveFormatted: string;
  toTokenSymbol: string;
}

export interface QuoteOptions {
  sortBy?: "cost" | "time" | "balance";
  maxSlippage?: number;
}

export interface UseRouteQuoteInput {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken?: string;
  amount: string;
  options?: QuoteOptions;
}

export interface UseRouteQuoteReturn {
  /** Current list of quotes (sorted by options.sortBy) */
  quotes: Quote[];
  /** Whether a quote request is in flight */
  loading: boolean;
  /** Error that occurred during the last request */
  error: Error | null;
  /** Manually trigger a refresh (re-fetches quotes) */
  refresh: () => Promise<void>;
  /** Clear the current quotes and error state */
  clear: () => void;
}

/**
 * Hook for fetching cross-chain route quotes.
 *
 * Automatically re-fetches when input parameters change.
 * Debounces rapid changes to avoid excessive API calls.
 *
 * @param input - Quote request parameters
 * @param getQuoteFn - Function that performs the actual quote fetch
 */
export function useRouteQuote(
  input: UseRouteQuoteInput,
  getQuoteFn?: (from: string, to: string, token: string, amount: string, options?: QuoteOptions) => Promise<Quote[]>,
): UseRouteQuoteReturn {
  const { fromChain, toChain, fromToken, toToken, amount, options } = input;
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const fetchQuotes = useCallback(async () => {
    if (!fromChain || !toChain || !fromToken || !amount || BigInt(amount) <= 0n) {
      setQuotes([]);
      return;
    }

    if (!getQuoteFn) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getQuoteFn(
        fromChain,
        toChain,
        fromToken,
        amount,
        options,
      );

      if (mountedRef.current) {
        setQuotes(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setQuotes([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [fromChain, toChain, fromToken, amount, options, getQuoteFn]);

  // Debounced auto-fetch on input change
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Don't fetch if parameters are incomplete
    if (!fromChain || !toChain || !fromToken || !amount) {
      setQuotes([]);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      fetchQuotes();
    }, 300); // 300ms debounce

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [fetchQuotes, fromChain, toChain, fromToken, amount]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    await fetchQuotes();
  }, [fetchQuotes]);

  const clear = useCallback(() => {
    setQuotes([]);
    setError(null);
    setLoading(false);
  }, []);

  return { quotes, loading, error, refresh, clear };
}
