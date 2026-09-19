import type { MaybeRef, ShallowRef } from "vue";
import { onScopeDispose, shallowRef, unref } from "vue";

export type SignMessageAction = (message: string) => Promise<string>;

export interface UseSignMessageReturn {
  signMessage: SignMessageAction;
  isSigning: ShallowRef<boolean>;
  error: ShallowRef<Error | null>;
  reset: () => void;
}

/** Reactive state around a caller-owned message-signing action. */
export function useSignMessage(
  action: MaybeRef<SignMessageAction>,
): UseSignMessageReturn {
  const isSigning = shallowRef(false);
  const error = shallowRef<Error | null>(null);
  let active = 0;
  let generation = 0;
  let disposed = false;

  const signMessage: SignMessageAction = async (message) => {
    const invoke = unref(action);
    const own = ++generation;
    active++;
    isSigning.value = true;
    error.value = null;
    try {
      return await invoke(message);
    } catch (cause) {
      const normalized =
        cause instanceof Error ? cause : new Error("Signing failed");
      if (!disposed && own === generation) error.value = normalized;
      throw normalized;
    } finally {
      active--;
      if (!disposed) isSigning.value = active > 0;
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
  return { signMessage, isSigning, error, reset };
}
