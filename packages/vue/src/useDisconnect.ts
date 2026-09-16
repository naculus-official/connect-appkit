import type { MaybeRef, MaybeRefOrGetter, ShallowRef } from "vue";
import { onScopeDispose, shallowRef, toValue, unref } from "vue";

export interface UseDisconnectReturn {
  disconnect: () => Promise<void>;
  isDisconnecting: ShallowRef<boolean>;
  error: ShallowRef<Error | null>;
  cleanup: () => void;
}

/** Disconnect through a caller-owned action, preserving React's no-op when already disconnected. */
export function useDisconnect(
  action: MaybeRef<() => Promise<void>>,
  status: MaybeRefOrGetter<string>,
): UseDisconnectReturn {
  const isDisconnecting = shallowRef(false);
  const error = shallowRef<Error | null>(null);
  let disposed = false;
  let inFlight: Promise<void> | null = null;

  const disconnect = (): Promise<void> => {
    if (inFlight) return inFlight;
    if (toValue(status) === "disconnected") return Promise.resolve();
    const invoke = unref(action);
    isDisconnecting.value = true;
    error.value = null;
    const pending = Promise.resolve()
      .then(() => invoke())
      .catch((cause: unknown) => {
        if (!disposed) {
          error.value =
            cause instanceof Error ? cause : new Error("Disconnect failed");
        }
      })
      .finally(() => {
        if (inFlight === pending) inFlight = null;
        if (!disposed) isDisconnecting.value = false;
      });
    inFlight = pending;
    return pending;
  };

  const cleanup = (): void => {
    disposed = true;
  };
  onScopeDispose(cleanup);
  return { disconnect, isDisconnecting, error, cleanup };
}
