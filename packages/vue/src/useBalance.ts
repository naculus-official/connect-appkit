import { bareEvmAddress } from "@naculus/connect-appkit-core";
import { formatUnits } from "@naculus/connect-core";
import type { ComputedRef, MaybeRefOrGetter, ShallowRef } from "vue";
import { computed, onScopeDispose, shallowRef, toValue, watch } from "vue";

/** Minimal read-only contract; a viem PublicClient satisfies it. */
export interface NativeBalanceReader {
  getBalance(args: { address: `0x${string}` }): Promise<bigint>;
}

export interface UseBalanceOptions {
  /** Native currency decimals. Default 18. */
  decimals?: MaybeRefOrGetter<number | null | undefined>;
  /**
   * Native currency symbol, or null when it is not known. Null rather than
   * "ETH": a wrong unit beside the number is worse than no unit.
   */
  symbol?: MaybeRefOrGetter<string | null | undefined>;
  /** Auto-refresh interval in milliseconds. Default: no auto-refresh. */
  refreshInterval?: MaybeRefOrGetter<number | null | undefined>;
}

export interface UseBalanceReturn {
  /** Raw balance in wei as a decimal string, or null when unread. */
  balance: ShallowRef<string | null>;
  /** Human-readable balance in the native unit, or null when unread. */
  formatted: ComputedRef<string | null>;
  symbol: ComputedRef<string | null>;
  isFetching: ShallowRef<boolean>;
  error: ShallowRef<Error | null>;
  refetch: () => Promise<void>;
}

/**
 * Native balance of an EVM account through a caller-owned reader.
 *
 * Vue has no AppKit provider, so the client is explicit. Unlike the React
 * hook this does not fetch a USD price: that is an outward HTTP call the
 * caller did not hand us, and it belongs beside the reader they did.
 */
export function useBalance(
  account: MaybeRefOrGetter<string | null | undefined>,
  client: MaybeRefOrGetter<NativeBalanceReader | null | undefined>,
  options: UseBalanceOptions = {},
): UseBalanceReturn {
  const balance = shallowRef<string | null>(null);
  const isFetching = shallowRef(false);
  const error = shallowRef<Error | null>(null);
  let generation = 0;
  let disposed = false;
  let timer: ReturnType<typeof setInterval> | null = null;

  const refetch = async (): Promise<void> => {
    const reader = toValue(client);
    const address = bareEvmAddress(toValue(account));
    const own = ++generation;
    if (!reader || !address) {
      balance.value = null;
      error.value = null;
      isFetching.value = false;
      return;
    }
    isFetching.value = true;
    error.value = null;
    try {
      const next = await reader.getBalance({ address });
      if (disposed || own !== generation) return;
      balance.value = next.toString();
    } catch (cause) {
      if (disposed || own !== generation) return;
      // Cleared rather than left stale: a balance shown next to an error
      // reads as the current balance, and it is not.
      balance.value = null;
      error.value =
        cause instanceof Error ? cause : new Error("Balance read failed");
    } finally {
      if (!disposed && own === generation) isFetching.value = false;
    }
  };

  const stopTimer = (): void => {
    if (timer) clearInterval(timer);
    timer = null;
  };

  watch(
    [
      () => toValue(account),
      () => toValue(client),
      () => toValue(options.refreshInterval) ?? 0,
    ],
    ([, , interval]) => {
      stopTimer();
      void refetch();
      if (interval > 0) timer = setInterval(() => void refetch(), interval);
    },
    { immediate: true },
  );

  onScopeDispose(() => {
    disposed = true;
    generation++;
    stopTimer();
  });

  return {
    balance,
    formatted: computed(() =>
      balance.value === null
        ? null
        : formatUnits(BigInt(balance.value), toValue(options.decimals) ?? 18),
    ),
    symbol: computed(() => toValue(options.symbol) ?? null),
    isFetching,
    error,
    refetch,
  };
}
