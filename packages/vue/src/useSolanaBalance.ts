import {
  getSolanaBalance,
  type SolanaBalance,
} from "@naculus/connect-core";
import { onScopeDispose, ref, shallowRef, toValue, watchEffect } from "vue";
import type { MaybeRefOrGetter } from "vue";

export interface UseSolanaBalanceReturn {
  balance: ReturnType<typeof shallowRef<SolanaBalance | null>>;
  isFetching: ReturnType<typeof ref<boolean>>;
  error: ReturnType<typeof shallowRef<Error | null>>;
  refetch: () => Promise<void>;
}

/**
 * The SOL balance of an address.
 *
 * The whole of this file is Vue plumbing. Every decision that took thought —
 * exact lamport arithmetic, distinguishing an unfunded account from an emptied
 * one, refusing to invent a zero — is in `@naculus/connect-core`, shared with
 * the React hook. That is what makes "author in React, ship to Vue" true for
 * the logic: what does not translate is only the reactivity.
 *
 * Takes its address and endpoint as arguments because Vue has no equivalent of
 * the React provider here. Refs and getters both work.
 */
export function useSolanaBalance(
  address: MaybeRefOrGetter<string | null | undefined>,
  rpcUrl: MaybeRefOrGetter<string | null | undefined>,
): UseSolanaBalanceReturn {
  const balance = shallowRef<SolanaBalance | null>(null);
  const isFetching = ref(false);
  const error = shallowRef<Error | null>(null);
  // Guards against a slow response for a previous address overwriting the
  // balance of the one now on screen.
  let generation = 0;
  let disposed = false;

  const refetch = async () => {
    const addr = toValue(address);
    const url = toValue(rpcUrl);
    if (!addr || !url) {
      balance.value = null;
      return;
    }
    const own = ++generation;
    isFetching.value = true;
    error.value = null;
    try {
      const next = await getSolanaBalance(url, addr);
      if (disposed || own !== generation) return;
      balance.value = next;
    } catch (err) {
      if (disposed || own !== generation) return;
      // Cleared rather than left stale: a balance shown next to an error
      // reads as the current balance, and it is not.
      balance.value = null;
      error.value =
        err instanceof Error ? err : new Error("Balance read failed");
    } finally {
      if (!disposed && own === generation) isFetching.value = false;
    }
  };

  watchEffect(() => {
    // Touch both so the effect re-runs when either changes.
    toValue(address);
    toValue(rpcUrl);
    void refetch();
  });

  onScopeDispose(() => {
    disposed = true;
  });

  return { balance, isFetching, error, refetch };
}
