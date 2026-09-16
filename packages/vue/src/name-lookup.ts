import { getResolver } from "@naculus/connect-appkit-core";
import type { NameResolver, NameResolverConfig } from "@naculus/connect-core";
import type { ComputedRef, MaybeRefOrGetter, ShallowRef } from "vue";
import { computed, onScopeDispose, shallowRef, toValue, watch } from "vue";

export interface NameLookupReturn<T> {
  data: ShallowRef<T | null>;
  isLoading: ComputedRef<boolean>;
  error: ShallowRef<Error | null>;
  refetch: () => void;
}

interface NameLookupOptions<T> {
  input: MaybeRefOrGetter<string>;
  skip?: MaybeRefOrGetter<boolean | undefined>;
  resolverConfig?: MaybeRefOrGetter<NameResolverConfig | undefined>;
  scope?: MaybeRefOrGetter<string | undefined>;
  query: (
    resolver: NameResolver,
    input: string,
    scope?: string,
  ) => Promise<T | null>;
}

/** Shared race-safe lifecycle for forward and reverse name lookups. */
export function useNameLookup<T>(
  options: NameLookupOptions<T>,
): NameLookupReturn<T> {
  const data = shallowRef<T | null>(null) as ShallowRef<T | null>;
  const loading = shallowRef(false);
  const error = shallowRef<Error | null>(null);
  let generation = 0;
  let disposed = false;

  const run = (): void => {
    const input = toValue(options.input).trim();
    const skip = toValue(options.skip) ?? false;
    const scope = toValue(options.scope);
    const config = toValue(options.resolverConfig);
    const mine = ++generation;
    if (!input || skip) {
      data.value = null;
      loading.value = false;
      error.value = null;
      return;
    }

    // Never show the previous name/address beside a new input while it loads.
    data.value = null;
    loading.value = true;
    error.value = null;
    Promise.resolve()
      .then(() => options.query(getResolver(config), input, scope))
      .then((result) => {
        if (disposed || mine !== generation) return;
        data.value = result;
        loading.value = false;
      })
      .catch((cause: unknown) => {
        if (disposed || mine !== generation) return;
        data.value = null;
        error.value = cause instanceof Error ? cause : new Error(String(cause));
        loading.value = false;
      });
  };

  watch(
    () =>
      [
        toValue(options.input),
        toValue(options.skip),
        toValue(options.scope),
        toValue(options.resolverConfig),
      ] as const,
    run,
    { immediate: true, flush: "sync", deep: true },
  );
  onScopeDispose(() => {
    disposed = true;
    generation++;
  });

  return {
    data,
    isLoading: computed(() => loading.value),
    error,
    refetch: run,
  };
}
