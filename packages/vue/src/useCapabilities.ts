import {
  atomicSupportFor,
  type AtomicSupport,
  type ChainCapabilities,
  normalizeCapabilities,
  selectChainCapabilities,
} from "@naculus/connect-appkit-core";
import { computed, shallowRef, toValue, watchEffect } from "vue";
import type { ComputedRef, MaybeRefOrGetter, ShallowRef } from "vue";

export type { AtomicSupport, ChainCapabilities };

/** The part of a connector this needs. Anything with these two is enough. */
export interface CapabilityClient {
  getCapabilities?: (session: unknown) => Promise<Record<string, unknown>>;
}

export interface UseCapabilitiesReturn {
  /** Per-chain, keyed by CAIP-2. Null until a query has actually returned. */
  capabilities: ShallowRef<Record<string, ChainCapabilities> | null>;
  /** The connected chain's entry, for the common case. */
  current: ComputedRef<ChainCapabilities | null>;
  /** Atomic support on the connected chain. `"unknown"` until told otherwise. */
  atomic: ComputedRef<AtomicSupport>;
  isFetching: ShallowRef<boolean>;
  error: ShallowRef<Error | null>;
  refetch: () => Promise<void>;
}

/**
 * What the connected wallet says it can do — EIP-5792
 * `wallet_getCapabilities`.
 *
 * The query a dApp makes *before* choosing how to execute: ask whether the
 * wallet batches atomically, then send one batch or a sequence, rather than
 * sending a batch and learning the answer from a rejection.
 *
 * Identical in substance to the React hook, because every decision in it —
 * normalising the raw answer, the CAIP-2/hex lookup, and `"unknown"` meaning
 * "not told" rather than "no" — is in `@naculus/connect-appkit-core` and
 * neither binding gets to disagree about it.
 *
 * Takes its client, session and chain as arguments. Vue has no equivalent of
 * the React provider here, which is the same shape `useChain` uses.
 */
export function useCapabilities(
  client: MaybeRefOrGetter<CapabilityClient | null | undefined>,
  session: MaybeRefOrGetter<unknown>,
  chainId: MaybeRefOrGetter<string | null | undefined>,
): UseCapabilitiesReturn {
  const capabilities = shallowRef<Record<string, ChainCapabilities> | null>(
    null,
  );
  const isFetching = shallowRef(false);
  const error = shallowRef<Error | null>(null);
  // Guards a slow answer for a previous session overwriting a newer one.
  let generation = 0;

  const refetch = async () => {
    const mine = ++generation;
    const activeClient = toValue(client);
    const activeSession = toValue(session);
    if (!activeClient?.getCapabilities || !activeSession) {
      capabilities.value = null;
      isFetching.value = false;
      error.value = null;
      return;
    }
    isFetching.value = true;
    error.value = null;
    try {
      const raw = await activeClient.getCapabilities(activeSession);
      if (mine !== generation) return;
      capabilities.value = normalizeCapabilities(raw);
    } catch (err) {
      if (mine !== generation) return;
      // Cleared rather than left stale. A capability map from a previous
      // wallet is a worse answer than no answer.
      capabilities.value = null;
      error.value =
        err instanceof Error ? err : new Error("Capability query failed");
    } finally {
      if (mine === generation) isFetching.value = false;
    }
  };

  // Re-queries when the client or session changes, the way the React effect
  // does. `chainId` is deliberately not a trigger: it selects from an answer
  // already held rather than needing a new one.
  watchEffect(() => {
    void toValue(client);
    void toValue(session);
    void refetch();
  });

  return {
    capabilities,
    current: computed(() =>
      selectChainCapabilities(capabilities.value, toValue(chainId)),
    ),
    atomic: computed(() =>
      atomicSupportFor(capabilities.value, toValue(chainId)),
    ),
    isFetching,
    error,
    refetch,
  };
}
