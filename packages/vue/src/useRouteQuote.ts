import {
  type GetRouteQuotes,
  isQuotableInput,
  type RouteQuote,
  type RouteQuoteInput,
} from "@naculus/connect-appkit-core";
import type { MaybeRef, MaybeRefOrGetter, ShallowRef } from "vue";
import { onScopeDispose, shallowRef, toValue, unref, watch } from "vue";
import { useActionGuard } from "./internal/action-guard";

export interface UseRouteQuoteOptions {
  /** Debounce before auto-fetching after an input change (default 300 ms). */
  debounceMs?: number;
}

export interface UseRouteQuoteReturn {
  quotes: ShallowRef<RouteQuote[]>;
  loading: ShallowRef<boolean>;
  error: ShallowRef<Error | null>;
  refresh: () => Promise<void>;
  clear: () => void;
}

/**
 * Debounced cross-chain route quotes through a caller-supplied quote
 * function, mirroring the React hook. Which inputs are quotable is decided
 * in appkit-core; this file debounces and drops late results.
 */
export function useRouteQuote(
  input: MaybeRefOrGetter<RouteQuoteInput>,
  getQuotes?: MaybeRef<GetRouteQuotes | null | undefined>,
  options: UseRouteQuoteOptions = {},
): UseRouteQuoteReturn {
  // loading stays newest-only rather than the guard's counted busy flag.
  const guard = useActionGuard();
  const quotes = shallowRef<RouteQuote[]>([]);
  const loading = shallowRef(false);
  let timer: ReturnType<typeof setTimeout> | null = null;

  const clearTimer = (): void => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  const fetchQuotes = async (): Promise<void> => {
    const current = toValue(input);
    const fn = unref(getQuotes);
    // Early exits supersede the in-flight request but, as before, leave the
    // visible error and the loading flag alone.
    if (!isQuotableInput(current)) {
      guard.invalidate();
      quotes.value = [];
      return;
    }
    if (!fn) {
      guard.invalidate();
      return;
    }
    loading.value = true;
    await guard
      .run(
        async (commit) => {
          try {
            const result = await fn(
              current.fromChain,
              current.toChain,
              current.fromToken,
              current.amount,
              current.options,
              current.toToken,
            );
            commit(() => {
              quotes.value = result;
            });
          } catch (cause) {
            commit(() => {
              quotes.value = [];
            });
            throw cause;
          }
        },
        "Route quote failed",
        (cause) => (cause instanceof Error ? cause : new Error(String(cause))),
        {
          onSettled: () => {
            loading.value = false;
          },
        },
      )
      .catch(() => {});
  };

  watch(
    [
      () => toValue(input).fromChain,
      () => toValue(input).toChain,
      () => toValue(input).fromToken,
      () => toValue(input).toToken,
      () => toValue(input).amount,
      () => unref(getQuotes),
    ],
    ([fromChain, toChain, fromToken, , amount]) => {
      clearTimer();
      if (!fromChain || !toChain || !fromToken || !amount) {
        quotes.value = [];
        return;
      }
      timer = setTimeout(() => {
        timer = null;
        void fetchQuotes();
      }, options.debounceMs ?? 300);
    },
    { immediate: true },
  );

  onScopeDispose(clearTimer);

  return {
    quotes,
    loading,
    error: guard.error,
    refresh: fetchQuotes,
    clear: () => {
      clearTimer();
      guard.reset();
      quotes.value = [];
      loading.value = false;
    },
  };
}
