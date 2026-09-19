import type { MaybeRef, ShallowRef } from "vue";
import { onScopeDispose, shallowRef, unref } from "vue";
import type { SiwxResult, SiwxSignInAction } from "./siwx";

export interface UseSignInWithXReturn {
  signIn: SiwxSignInAction;
  isSigningIn: ShallowRef<boolean>;
  result: ShallowRef<SiwxResult | null>;
  error: ShallowRef<Error | null>;
  clearError: () => void;
  reset: () => void;
}

/** Reactive state around a caller-owned SIWX sign-in action. */
export function useSignInWithX(
  action: MaybeRef<SiwxSignInAction>,
): UseSignInWithXReturn {
  const isSigningIn = shallowRef(false);
  const result = shallowRef<SiwxResult | null>(null);
  const error = shallowRef<Error | null>(null);
  let generation = 0;
  let active = 0;
  let disposed = false;

  const signIn: SiwxSignInAction = async (options) => {
    const invoke = unref(action);
    const own = ++generation;
    active++;
    isSigningIn.value = true;
    error.value = null;
    try {
      const next = await invoke(options);
      if (!disposed && own === generation) result.value = next;
      return next;
    } catch (cause) {
      const normalized =
        cause instanceof Error ? cause : new Error("SIWX sign-in failed");
      if (!disposed && own === generation) error.value = normalized;
      throw normalized;
    } finally {
      active--;
      if (!disposed) isSigningIn.value = active > 0;
    }
  };
  const clearError = (): void => {
    error.value = null;
  };
  const reset = (): void => {
    generation++;
    result.value = null;
    error.value = null;
  };
  onScopeDispose(() => {
    disposed = true;
    generation++;
  });
  return { signIn, isSigningIn, result, error, clearError, reset };
}
