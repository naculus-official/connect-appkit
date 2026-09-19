import type { ComputedRef, MaybeRef, MaybeRefOrGetter, ShallowRef } from "vue";
import { computed, onScopeDispose, shallowRef, toValue, unref } from "vue";
import type {
  ExecuteCallsAction,
  ExecutionRoute,
  PreviewExecutionAction,
} from "./eip5792";

export interface UseExecuteCallsOptions {
  preview: MaybeRef<PreviewExecutionAction>;
  execute: MaybeRef<ExecuteCallsAction>;
  lastRoute: MaybeRefOrGetter<ExecutionRoute | null>;
  reset: MaybeRef<() => void>;
}

export interface UseExecuteCallsReturn {
  preview: PreviewExecutionAction;
  execute: ExecuteCallsAction;
  isExecuting: ShallowRef<boolean>;
  error: ShallowRef<Error | null>;
  lastRoute: ComputedRef<ExecutionRoute | null>;
  reset: () => void;
}

/** Reactive state around a caller-owned EIP-5792 execution planner/action. */
export function useExecuteCalls(
  options: UseExecuteCallsOptions,
): UseExecuteCallsReturn {
  const isExecuting = shallowRef(false);
  const error = shallowRef<Error | null>(null);
  let generation = 0;
  let active = 0;
  let disposed = false;

  const preview: PreviewExecutionAction = (callCount, atomicity) =>
    unref(options.preview)(callCount, atomicity);

  const execute: ExecuteCallsAction = async (calls, atomicity) => {
    const invoke = unref(options.execute);
    const own = ++generation;
    active++;
    isExecuting.value = true;
    error.value = null;
    try {
      return await invoke(calls, atomicity);
    } catch (cause) {
      const normalized =
        cause instanceof Error ? cause : new Error("Execution failed");
      if (!disposed && own === generation) error.value = normalized;
      throw normalized;
    } finally {
      active--;
      if (!disposed) isExecuting.value = active > 0;
    }
  };

  const reset = (): void => {
    generation++;
    error.value = null;
    unref(options.reset)();
  };

  onScopeDispose(() => {
    disposed = true;
    generation++;
  });

  return {
    preview,
    execute,
    isExecuting,
    error,
    lastRoute: computed(() => toValue(options.lastRoute)),
    reset,
  };
}
