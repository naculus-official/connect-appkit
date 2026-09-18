import {
  type SimulationCallClient,
  type SimulationTransaction,
  simulateTransactionPreview,
  type WalletChain,
} from "@naculus/connect-appkit-core";
import type { SimulationResult } from "@naculus/connect-core";
import type { MaybeRef, MaybeRefOrGetter, ShallowRef } from "vue";
import { onScopeDispose, shallowRef, toValue, unref, watch } from "vue";

export interface UseTransactionSimulationOptions {
  chainId?: MaybeRef<number | undefined>;
  currentChain?: MaybeRef<WalletChain | null | undefined>;
  publicClient?: MaybeRef<SimulationCallClient | null | undefined>;
  evmAccount?: MaybeRef<string | null | undefined>;
}

export interface UseTransactionSimulationReturn {
  result: ShallowRef<SimulationResult | undefined>;
  isSimulating: ShallowRef<boolean>;
  error: ShallowRef<Error | null>;
  simulate: () => Promise<SimulationResult>;
  reset: () => void;
}

/** Basic eth_call preview; caller supplies chain/account/client context. */
export function useTransactionSimulation(
  tx: MaybeRefOrGetter<SimulationTransaction | undefined>,
  options: UseTransactionSimulationOptions = {},
): UseTransactionSimulationReturn {
  const result = shallowRef<SimulationResult | undefined>(undefined);
  const isSimulating = shallowRef(false);
  const error = shallowRef<Error | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let generation = 0;
  let disposed = false;

  const simulate = async (): Promise<SimulationResult> => {
    const own = ++generation;
    const transaction = toValue(tx);
    if (transaction) {
      isSimulating.value = true;
      error.value = null;
    }
    try {
      const value = await simulateTransactionPreview(transaction, {
        chainId: unref(options.chainId),
        currentChain: unref(options.currentChain),
        publicClient: unref(options.publicClient),
        evmAccount: unref(options.evmAccount),
      });
      if (!disposed && own === generation) result.value = value;
      return value;
    } catch (cause) {
      const normalized =
        cause instanceof Error ? cause : new Error("Simulation failed");
      if (!disposed && own === generation) error.value = normalized;
      throw normalized;
    } finally {
      if (transaction && !disposed && own === generation)
        isSimulating.value = false;
    }
  };

  watch(
    [
      () => toValue(tx),
      () => unref(options.chainId),
      () => unref(options.currentChain),
      () => unref(options.publicClient),
      () => unref(options.evmAccount),
    ],
    ([transaction]) => {
      generation++;
      if (timer) clearTimeout(timer);
      if (!transaction) return;
      timer = setTimeout(() => {
        timer = undefined;
        void simulate().catch(() => {
          // Error is captured in state.
        });
      }, 300);
    },
    { immediate: true },
  );

  const reset = (): void => {
    generation++;
    result.value = undefined;
    error.value = null;
    isSimulating.value = false;
  };
  onScopeDispose(() => {
    disposed = true;
    generation++;
    if (timer) clearTimeout(timer);
  });

  return { result, isSimulating, error, simulate, reset };
}
