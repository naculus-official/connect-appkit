import {
  computed,
  shallowRef,
  toValue,
  watch,
} from "vue";
import type { ComputedRef, MaybeRefOrGetter, ShallowRef } from "vue";

export type TxStatus =
  | "pending"
  | "mined"
  | "confirmed"
  | "failed"
  | "unknown";

export interface TxStatusEntry {
  hash: string;
  chainId: number;
  from: string;
  to: string;
  value: string;
  data?: string;
  nonce?: number;
  status: TxStatus;
  blockNumber?: number;
  blockHash?: string;
  gasUsed?: string;
  effectiveGasPrice?: string;
  createdAt: number;
  confirmedAt?: number;
  updatedAt: number;
  error?: string;
  label?: string;
  memo?: string;
  replacementCount?: number;
}

/** Structural contract accepted by the transaction-monitor composables. */
export interface TxMonitorLike {
  watchTx(
    hash: string,
    chainId: number,
    options?: Record<string, unknown>,
  ): Promise<TxStatusEntry>;
  stopWatching(hash: string, chainId?: number): void;
  getTxStatus(hash: string, chainId?: number): TxStatusEntry | null;
  getTxHistory(address?: string, chainId?: number): Promise<TxStatusEntry[]>;
  refreshTx(hash: string, chainId?: number): Promise<void>;
  on(event: "statusChange", listener: (entry: TxStatusEntry) => void): this;
  on(event: "confirmed", listener: (entry: TxStatusEntry) => void): this;
  on(event: "failed", listener: (entry: TxStatusEntry) => void): this;
  off(event: string, listener: Function): this;
}

export interface UseTxMonitorReturn {
  entry: ShallowRef<TxStatusEntry | null>;
  status: ComputedRef<TxStatus | "idle">;
  isLoading: ShallowRef<boolean>;
  isWatching: ShallowRef<boolean>;
  error: ShallowRef<Error | null>;
  refresh: () => Promise<void>;
  stopWatching: () => void;
}

/**
 * Reactively monitor one transaction using a caller-owned TxMonitor.
 *
 * Vue has no AppKit monitor provider, so the monitor is explicit. The hook
 * listens only while its source values are current; a late promise from a
 * previous hash, chain, or monitor cannot overwrite the active result.
 */
export function useTxMonitor(
  hash: MaybeRefOrGetter<string | null | undefined>,
  chainId: MaybeRefOrGetter<number | null | undefined>,
  monitor: MaybeRefOrGetter<TxMonitorLike | null | undefined>,
): UseTxMonitorReturn {
  const entry = shallowRef<TxStatusEntry | null>(null);
  const isLoading = shallowRef(false);
  const isWatching = shallowRef(false);
  const error = shallowRef<Error | null>(null);
  let generation = 0;

  const refresh = async (): Promise<void> => {
    const activeMonitor = toValue(monitor);
    const activeHash = toValue(hash);
    const activeChainId = toValue(chainId);
    if (!activeMonitor || !activeHash) return;

    isLoading.value = true;
    error.value = null;
    try {
      await activeMonitor.refreshTx(activeHash, activeChainId ?? undefined);
      const current = activeMonitor.getTxStatus(
        activeHash,
        activeChainId ?? undefined,
      );
      if (current) entry.value = current;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to refresh transaction");
    } finally {
      isLoading.value = false;
    }
  };

  const stopWatching = (): void => {
    const activeMonitor = toValue(monitor);
    const activeHash = toValue(hash);
    const activeChainId = toValue(chainId);
    if (!activeMonitor || !activeHash) return;
    activeMonitor.stopWatching(activeHash, activeChainId ?? undefined);
    isWatching.value = false;
  };

  watch(
    () => [toValue(monitor), toValue(hash), toValue(chainId)] as const,
    ([activeMonitor, activeHash, activeChainId], _previous, onCleanup) => {
      const mine = ++generation;
      if (!activeMonitor || !activeHash || !activeChainId) {
        entry.value = null;
        isLoading.value = false;
        isWatching.value = false;
        error.value = null;
        return;
      }

      let cancelled = false;
      const onStatusChange = (updated: TxStatusEntry): void => {
        if (!cancelled && updated.hash === activeHash && updated.chainId === activeChainId) {
          entry.value = { ...updated };
        }
      };
      activeMonitor.on("statusChange", onStatusChange);
      onCleanup(() => {
        cancelled = true;
        activeMonitor.off("statusChange", onStatusChange);
      });

      isWatching.value = true;
      isLoading.value = true;
      error.value = null;
      const current = activeMonitor.getTxStatus(activeHash, activeChainId);
      if (current) entry.value = current;

      activeMonitor
        .watchTx(activeHash, activeChainId, {})
        .then((initial) => {
          if (cancelled || mine !== generation) return;
          entry.value = initial;
          isLoading.value = false;
        })
        .catch((err) => {
          if (cancelled || mine !== generation) return;
          error.value =
            err instanceof Error ? err : new Error("Failed to watch transaction");
          isLoading.value = false;
        });
    },
    { immediate: true },
  );

  return {
    entry,
    status: computed(() => entry.value?.status ?? "idle"),
    isLoading,
    isWatching,
    error,
    refresh,
    stopWatching,
  };
}
