import {
  type CompareCosts,
  type CompareCostsInput,
  type CostComparison,
  compareCostsKey,
} from "@naculus/connect-appkit-core";
import type { MaybeRef, MaybeRefOrGetter, ShallowRef } from "vue";
import { onScopeDispose, shallowRef, toValue, unref, watch } from "vue";

export interface UseCompareCostsReturn {
  comparisons: ShallowRef<CostComparison[]>;
  loading: ShallowRef<boolean>;
  error: ShallowRef<Error | null>;
  refresh: () => Promise<void>;
}

/**
 * Compare an operation's cost across chains through a caller-supplied
 * function, mirroring the React hook. Re-fetches when the input's *value*
 * changes (appkit-core's `compareCostsKey`), not when a new array or object
 * with the same content is passed; only the newest request may write.
 */
export function useCompareCosts(
  input: MaybeRefOrGetter<CompareCostsInput>,
  compareCosts?: MaybeRef<CompareCosts | null | undefined>,
): UseCompareCostsReturn {
  const comparisons = shallowRef<CostComparison[]>([]);
  const loading = shallowRef(false);
  const error = shallowRef<Error | null>(null);
  let generation = 0;
  let disposed = false;

  const fetchComparisons = async (): Promise<void> => {
    const { operation, chains, options } = toValue(input);
    const fn = unref(compareCosts);
    const own = ++generation;
    if (!chains || chains.length === 0) {
      comparisons.value = [];
      return;
    }
    if (!fn) return;
    loading.value = true;
    error.value = null;
    try {
      const result = await fn(operation, chains, options);
      if (disposed || own !== generation) return;
      comparisons.value = result;
    } catch (cause) {
      if (disposed || own !== generation) return;
      error.value = cause instanceof Error ? cause : new Error(String(cause));
      comparisons.value = [];
    } finally {
      if (!disposed && own === generation) loading.value = false;
    }
  };

  watch(
    [() => compareCostsKey(toValue(input)), () => unref(compareCosts)],
    () => {
      void fetchComparisons();
    },
    { immediate: true },
  );

  onScopeDispose(() => {
    disposed = true;
    generation++;
  });

  return { comparisons, loading, error, refresh: fetchComparisons };
}
