import { toChainSwitchError } from "@naculus/connect-appkit-core";
import type { WalletError } from "@naculus/connect-core";
import type { ComputedRef, MaybeRef, MaybeRefOrGetter, ShallowRef } from "vue";
import { computed, onScopeDispose, shallowRef, toValue, unref } from "vue";

export interface UseSwitchChainReturn {
  switchChain: (chainId: string) => Promise<void>;
  isSwitching: ShallowRef<boolean>;
  currentChainId: ComputedRef<string | null>;
  error: ShallowRef<WalletError | null>;
  clearError: () => void;
}

/** Vue counterpart of React useSwitchChain around a caller-owned action. */
export function useSwitchChain(
  action: MaybeRef<(chainId: string) => Promise<void>>,
  chainId: MaybeRefOrGetter<string | null | undefined>,
): UseSwitchChainReturn {
  const isSwitching = shallowRef(false);
  const error = shallowRef<WalletError | null>(null);
  let generation = 0;
  let active = 0;
  let disposed = false;

  const switchChain = async (targetChainId: string): Promise<void> => {
    const invoke = unref(action);
    const mine = ++generation;
    active++;
    isSwitching.value = true;
    error.value = null;
    try {
      await invoke(targetChainId);
    } catch (cause) {
      const walletError = toChainSwitchError(cause);
      if (!disposed && mine === generation) error.value = walletError;
      throw walletError;
    } finally {
      active--;
      if (!disposed) isSwitching.value = active > 0;
    }
  };

  onScopeDispose(() => {
    disposed = true;
    generation++;
  });
  return {
    switchChain,
    isSwitching,
    currentChainId: computed(() => toValue(chainId) ?? null),
    error,
    clearError: () => {
      error.value = null;
    },
  };
}
