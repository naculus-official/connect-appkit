import type { SolanaConfirmationStatus } from "@naculus/connect-core";
import type { MaybeRef, ShallowRef } from "vue";
import { onScopeDispose, shallowRef, unref } from "vue";

export type SolanaTransaction = Uint8Array | string;
export type SignSolanaTransactionAction = (
  transaction: SolanaTransaction,
) => Promise<Uint8Array>;
export type SendSolanaTransactionAction = (
  transaction: SolanaTransaction,
) => Promise<string>;
export type GetSolanaTransactionStatusAction = (
  signature: string,
) => Promise<{ status: SolanaConfirmationStatus; error: string | null }>;

export interface UseSolanaTransactionOptions {
  signTransaction: MaybeRef<SignSolanaTransactionAction>;
  sendTransaction: MaybeRef<SendSolanaTransactionAction>;
  getStatus: MaybeRef<GetSolanaTransactionStatusAction>;
}

export interface UseSolanaTransactionReturn {
  signTransaction: SignSolanaTransactionAction;
  sendTransaction: SendSolanaTransactionAction;
  getStatus: GetSolanaTransactionStatusAction;
  isSigning: ShallowRef<boolean>;
  isSending: ShallowRef<boolean>;
  error: ShallowRef<Error | null>;
  reset: () => void;
}

/** Reactive state around caller-owned Solana sign, send, and status actions. */
export function useSolanaTransaction(
  options: UseSolanaTransactionOptions,
): UseSolanaTransactionReturn {
  const isSigning = shallowRef(false);
  const isSending = shallowRef(false);
  const error = shallowRef<Error | null>(null);
  let signing = 0;
  let sending = 0;
  let generation = 0;
  let disposed = false;

  const signTransaction: SignSolanaTransactionAction = async (transaction) => {
    const invoke = unref(options.signTransaction);
    const own = ++generation;
    signing++;
    isSigning.value = true;
    error.value = null;
    try {
      return await invoke(transaction);
    } catch (cause) {
      const normalized =
        cause instanceof Error ? cause : new Error("Signing failed");
      if (!disposed && own === generation) error.value = normalized;
      throw normalized;
    } finally {
      signing--;
      if (!disposed) isSigning.value = signing > 0;
    }
  };

  const sendTransaction: SendSolanaTransactionAction = async (transaction) => {
    const invoke = unref(options.sendTransaction);
    const own = ++generation;
    sending++;
    isSending.value = true;
    error.value = null;
    try {
      return await invoke(transaction);
    } catch (cause) {
      const normalized =
        cause instanceof Error ? cause : new Error("Send failed");
      if (!disposed && own === generation) error.value = normalized;
      throw normalized;
    } finally {
      sending--;
      if (!disposed) isSending.value = sending > 0;
    }
  };

  const getStatus: GetSolanaTransactionStatusAction = (signature) =>
    unref(options.getStatus)(signature);
  const reset = (): void => {
    generation++;
    error.value = null;
  };
  onScopeDispose(() => {
    disposed = true;
    generation++;
  });
  return {
    signTransaction,
    sendTransaction,
    getStatus,
    isSigning,
    isSending,
    error,
    reset,
  };
}
