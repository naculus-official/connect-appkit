import { eip155ChainIdToNumber } from "@naculus/connect-appkit-core";
import {
  TokenListManager,
  type TokenListEntry,
  type TokenListManagerConfig,
  type TokenListSource,
} from "@naculus/connect-core";
import type { MaybeRefOrGetter, ShallowRef } from "vue";
import { onScopeDispose, shallowRef, toValue, watch } from "vue";

export interface UseTokenListOptions {
  /** Load on creation (default: true). */
  autoLoad?: boolean;
  /** Custom sources; the manager's defaults otherwise. */
  sources?: TokenListSource[];
  /** Reuse a caller-owned manager instead of creating one. */
  manager?: TokenListManager;
}

export interface UseTokenListReturn {
  /** Tokens for the given chain, or all chains when none is given. */
  tokens: ShallowRef<TokenListEntry[]>;
  isLoading: ShallowRef<boolean>;
  /** True once a load has completed at least once. */
  isLoaded: ShallowRef<boolean>;
  error: ShallowRef<Error | null>;
  /** Force a refresh from all sources. */
  refetch: () => Promise<void>;
}

/**
 * Token list for a chain, mirroring the React hook. The list logic, caching
 * and chain filtering are `TokenListManager`'s; this file is Vue plumbing.
 * The chain id is CAIP-2; a non-EVM chain yields the unfiltered list rather
 * than a bogus numeric filter.
 */
export function useTokenList(
  chainId?: MaybeRefOrGetter<string | null | undefined>,
  options: UseTokenListOptions = {},
): UseTokenListReturn {
  const config: Partial<TokenListManagerConfig> = {};
  if (options.sources) config.sources = options.sources;
  const manager = options.manager ?? new TokenListManager(config);

  const tokens = shallowRef<TokenListEntry[]>([]);
  const isLoading = shallowRef(options.autoLoad !== false);
  const isLoaded = shallowRef(false);
  const error = shallowRef<Error | null>(null);
  let generation = 0;
  let disposed = false;

  const select = (): TokenListEntry[] => {
    const id = toValue(chainId);
    const numeric = id ? eip155ChainIdToNumber(id) : undefined;
    return manager.getTokens(
      numeric !== undefined ? { chainId: numeric } : undefined,
    );
  };

  const run = async (op: () => Promise<unknown>): Promise<void> => {
    const own = ++generation;
    isLoading.value = true;
    error.value = null;
    try {
      await op();
      if (disposed || own !== generation) return;
      tokens.value = select();
      isLoaded.value = true;
    } catch (cause) {
      if (disposed || own !== generation) return;
      error.value = cause instanceof Error ? cause : new Error(String(cause));
    } finally {
      if (!disposed && own === generation) isLoading.value = false;
    }
  };

  watch(
    () => toValue(chainId),
    () => {
      if (options.autoLoad !== false) void run(() => manager.load());
    },
    { immediate: true },
  );

  onScopeDispose(() => {
    disposed = true;
    generation++;
  });

  return {
    tokens,
    isLoading,
    isLoaded,
    error,
    refetch: () => run(() => manager.refresh()),
  };
}
