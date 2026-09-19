import type { ComputedRef, MaybeRef, MaybeRefOrGetter, ShallowRef } from "vue";
import { computed, onScopeDispose, shallowRef, toValue, unref } from "vue";
import type { SiwxResult, SiwxSignInAction } from "./siwx";

export interface UseSiwxAuthSessionOptions {
  result: MaybeRefOrGetter<SiwxResult | null>;
  isRestoring: MaybeRefOrGetter<boolean>;
  signIn: MaybeRef<SiwxSignInAction>;
  signOut: MaybeRef<() => Promise<void>>;
}

export interface UseSiwxAuthSessionReturn {
  isSignedIn: ComputedRef<boolean>;
  isRestoring: ComputedRef<boolean>;
  siwxResult: ComputedRef<SiwxResult | null>;
  isSigningIn: ShallowRef<boolean>;
  error: ShallowRef<Error | null>;
  signIn: SiwxSignInAction;
  signOut: () => Promise<void>;
  clearError: () => void;
}

/** Reactive auth view over caller-owned, already-validated SIWX persistence. */
export function useSiwxAuthSession(
  options: UseSiwxAuthSessionOptions,
): UseSiwxAuthSessionReturn {
  const isSigningIn = shallowRef(false);
  const error = shallowRef<Error | null>(null);
  let generation = 0;
  let disposed = false;
  const signIn: SiwxSignInAction = async (input) => {
    const own = ++generation;
    isSigningIn.value = true;
    error.value = null;
    try {
      return await unref(options.signIn)(input);
    } catch (cause) {
      const normalized =
        cause instanceof Error ? cause : new Error("SIWX sign-in failed");
      if (!disposed && own === generation) error.value = normalized;
      throw normalized;
    } finally {
      if (!disposed && own === generation) isSigningIn.value = false;
    }
  };
  const signOut = async (): Promise<void> => {
    generation++;
    await unref(options.signOut)();
    if (!disposed) {
      isSigningIn.value = false;
      error.value = null;
    }
  };
  onScopeDispose(() => {
    disposed = true;
    generation++;
  });
  const siwxResult = computed(() => toValue(options.result));
  return {
    isSignedIn: computed(() => siwxResult.value !== null),
    isRestoring: computed(() => toValue(options.isRestoring)),
    siwxResult,
    isSigningIn,
    error,
    signIn,
    signOut,
    clearError: () => {
      error.value = null;
    },
  };
}
