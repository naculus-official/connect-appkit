import type { ComputedRef, MaybeRef, MaybeRefOrGetter, ShallowRef } from "vue";
import { computed, onScopeDispose, shallowRef, toValue, unref } from "vue";
import type { SiwxSessionLike, SiwxSignInOptions } from "./siwx";

export interface UseSIWxSessionOptions {
  session: MaybeRefOrGetter<SiwxSessionLike | null>;
  isRestoring: MaybeRefOrGetter<boolean>;
  isExpired: MaybeRefOrGetter<boolean>;
  timeUntilExpiry: MaybeRefOrGetter<number | null>;
  signIn: MaybeRef<(options?: SiwxSignInOptions) => Promise<SiwxSessionLike>>;
  signOut: MaybeRef<() => Promise<void>>;
  refresh: MaybeRef<() => Promise<SiwxSessionLike>>;
}

export interface UseSIWxSessionReturn {
  session: ComputedRef<SiwxSessionLike | null>;
  isAuthenticated: ComputedRef<boolean>;
  isRestoring: ComputedRef<boolean>;
  isSigningIn: ShallowRef<boolean>;
  isExpired: ComputedRef<boolean>;
  timeUntilExpiry: ComputedRef<number | null>;
  signIn: (options?: SiwxSignInOptions) => Promise<SiwxSessionLike>;
  signOut: () => Promise<void>;
  refresh: () => Promise<SiwxSessionLike>;
  error: ShallowRef<Error | null>;
  clearError: () => void;
}

/** Reactive view over caller-owned SIWX session lifecycle and policy state. */
export function useSIWxSession(
  options: UseSIWxSessionOptions,
): UseSIWxSessionReturn {
  const isSigningIn = shallowRef(false);
  const error = shallowRef<Error | null>(null);
  let generation = 0;
  let active = 0;
  let disposed = false;

  const run = async <T>(
    action: () => Promise<T>,
    message: string,
  ): Promise<T> => {
    const own = ++generation;
    active++;
    isSigningIn.value = true;
    error.value = null;
    try {
      return await action();
    } catch (cause) {
      const normalized = cause instanceof Error ? cause : new Error(message);
      if (!disposed && own === generation) error.value = normalized;
      throw normalized;
    } finally {
      active--;
      if (!disposed) isSigningIn.value = active > 0;
    }
  };

  onScopeDispose(() => {
    disposed = true;
    generation++;
  });
  return {
    session: computed(() => toValue(options.session)),
    isAuthenticated: computed(
      () => toValue(options.session) !== null && !toValue(options.isExpired),
    ),
    isRestoring: computed(() => toValue(options.isRestoring)),
    isSigningIn,
    isExpired: computed(() => toValue(options.isExpired)),
    timeUntilExpiry: computed(() => toValue(options.timeUntilExpiry)),
    signIn: (input) =>
      run(() => unref(options.signIn)(input), "SIWX sign-in failed"),
    signOut: async () => {
      await unref(options.signOut)();
      error.value = null;
    },
    refresh: () =>
      run(() => unref(options.refresh)(), "Session refresh failed"),
    error,
    clearError: () => {
      error.value = null;
    },
  };
}
