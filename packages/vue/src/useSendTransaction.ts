import type { ComputedRef, MaybeRef, ShallowRef } from "vue";
import { computed, onScopeDispose, shallowRef, unref } from "vue";

export interface EvmTransaction {
  to: string;
  from?: string;
  value?: string;
  data?: string;
  gas?: string;
  gasPrice?: string;
  nonce?: string;
  chainId?: number;
}

export type SendTransactionAction = (
  transaction: EvmTransaction,
) => Promise<string>;

export type SendTransactionStatus =
  | "idle"
  | "awaiting_approval"
  | "submitted"
  | "failed";

export interface UseSendTransactionReturn {
  sendTransaction: SendTransactionAction;
  status: ShallowRef<SendTransactionStatus>;
  error: ShallowRef<Error | null>;
  reset: () => void;
  isSending: ComputedRef<boolean>;
}

/** Reactive state around a caller-owned EVM transaction action. */
export function useSendTransaction(
  action: MaybeRef<SendTransactionAction>,
): UseSendTransactionReturn {
  const status = shallowRef<SendTransactionStatus>("idle");
  const error = shallowRef<Error | null>(null);
  let generation = 0;
  let disposed = false;

  const sendTransaction: SendTransactionAction = async (transaction) => {
    const invoke = unref(action);
    const own = ++generation;
    status.value = "awaiting_approval";
    error.value = null;
    try {
      const hash = await invoke(transaction);
      if (!disposed && own === generation) status.value = "submitted";
      return hash;
    } catch (cause) {
      const normalized =
        cause instanceof Error ? cause : new Error("Transaction failed");
      if (!disposed && own === generation) {
        status.value = "failed";
        error.value = normalized;
      }
      throw normalized;
    }
  };

  const reset = (): void => {
    generation++;
    status.value = "idle";
    error.value = null;
  };
  onScopeDispose(() => {
    disposed = true;
    generation++;
  });
  return {
    sendTransaction,
    status,
    error,
    reset,
    isSending: computed(() => status.value === "awaiting_approval"),
  };
}
