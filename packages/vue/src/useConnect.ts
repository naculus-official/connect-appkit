import { WalletError } from "@naculus/connect-core";
import type { ComputedRef, MaybeRef, MaybeRefOrGetter, ShallowRef } from "vue";
import { computed, onScopeDispose, shallowRef, toValue, unref } from "vue";

export interface UseConnectReturn {
  connect: () => Promise<void>;
  isConnecting: ComputedRef<boolean>;
  error: ShallowRef<Error | null>;
}

/** Connection state around a caller-owned action; never connects on mount. */
export function useConnect(
  action: MaybeRef<() => Promise<void>>,
  status: MaybeRefOrGetter<string>,
): UseConnectReturn {
  const isLoading = shallowRef(false);
  const error = shallowRef<Error | null>(null);
  let disposed = false;
  let inFlight: Promise<void> | null = null;

  const connect = (): Promise<void> => {
    if (inFlight) return inFlight;
    const invoke = unref(action);
    isLoading.value = true;
    error.value = null;
    const pending = Promise.resolve()
      .then(() => invoke())
      .catch((cause: unknown) => {
        if (disposed) return;
        const message =
          cause instanceof Error ? cause.message : "Connection failed";
        error.value = cause instanceof WalletError ? cause : new Error(message);
      })
      .finally(() => {
        if (inFlight === pending) inFlight = null;
        if (!disposed) isLoading.value = false;
      });
    inFlight = pending;
    return pending;
  };

  onScopeDispose(() => {
    disposed = true;
  });
  return {
    connect,
    isConnecting: computed(
      () => isLoading.value || toValue(status) === "connecting",
    ),
    error,
  };
}
