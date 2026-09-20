import type { ShallowRef } from "vue";
import { onScopeDispose, shallowRef } from "vue";

export interface ActionGuard {
  /** True while at least one guarded call is in flight. */
  busy: ShallowRef<boolean>;
  /** The most recent failure of the newest call; older failures are dropped. */
  error: ShallowRef<Error | null>;
  /**
   * Run `action`. Concurrency-counted busy flag; only the newest call may
   * publish an error; the error is rethrown so callers still see it.
   */
  run<T>(action: () => Promise<T>, fallbackMessage: string): Promise<T>;
  /** Forget the current error and stop any in-flight call from publishing. */
  reset(): void;
}

/**
 * The invocation guard every action-style composable needs, in one place.
 * Created inside a component scope; disposal is handled automatically.
 */
export function useActionGuard(): ActionGuard {
  const busy = shallowRef(false);
  const error = shallowRef<Error | null>(null);
  let active = 0;
  let generation = 0;
  let disposed = false;

  const run = async <T>(
    action: () => Promise<T>,
    fallbackMessage: string,
  ): Promise<T> => {
    const own = ++generation;
    active++;
    busy.value = true;
    error.value = null;
    try {
      return await action();
    } catch (cause) {
      const normalized =
        cause instanceof Error ? cause : new Error(fallbackMessage);
      if (!disposed && own === generation) error.value = normalized;
      throw normalized;
    } finally {
      active--;
      if (!disposed) busy.value = active > 0;
    }
  };

  const reset = (): void => {
    generation++;
    error.value = null;
  };

  onScopeDispose(() => {
    disposed = true;
    generation++;
  });

  return { busy, error, run, reset };
}
