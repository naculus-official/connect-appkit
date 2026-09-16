import {
  type GetRouteQuotes,
  isQuotableInput,
  type RouteQuote,
  type RouteQuoteInput,
} from "@naculus/connect-appkit-core";
import type { MaybeRef, MaybeRefOrGetter, ShallowRef } from "vue";
import { onScopeDispose, shallowRef, toValue, unref, watch } from "vue";

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
  const quotes = shallowRef<RouteQuote[]>([]);
  const loading = shallowRef(false);
  const error = shallowRef<Error | null>(null);
  let generation = 0;
  let disposed = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const clearTimer = (): void => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  const fetchQuotes = async (): Promise<void> => {
    const current = toValue(input);
    const fn = unref(getQuotes);
    const own = ++generation;
    if (!isQuotableInput(current)) {
      quotes.value = [];
      return;
    }
    if (!fn) return;
    loading.value = true;
    error.value = null;
    try {
      const result = await fn(
        current.fromChain,
        current.toChain,
        current.fromToken,
        current.amount,
        current.options,
        current.toToken,
      );
      if (disposed || own !== generation) return;
      quotes.value = result;
    } catch (cause) {
      if (disposed || own !== generation) return;
      error.value = cause instanceof Error ? cause : new Error(String(cause));
      quotes.value = [];
    } finally {
      if (!disposed && own === generation) loading.value = false;
    }
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

  onScopeDispose(() => {
    disposed = true;
    generation++;
    clearTimer();
  });

  return {
    quotes,
    loading,
    error,
    refresh: fetchQuotes,
    clear: () => {
      clearTimer();
      generation++;
      quotes.value = [];
      error.value = null;
      loading.value = false;
    },
  };
}
