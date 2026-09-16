import { computed, shallowRef, toValue, watch } from "vue";
import type { ComputedRef, MaybeRefOrGetter, ShallowRef } from "vue";
import type { TxMonitorLike, TxStatusEntry } from "./useTxMonitor";

export interface UseTxHistoryReturn {
  entries: ShallowRef<TxStatusEntry[]>;
  isLoading: ShallowRef<boolean>;
  error: ShallowRef<Error | null>;
  refresh: () => Promise<void>;
  summary: ComputedRef<{ pending: number; confirmed: number; failed: number }>;
}

/** Query and keep a caller-owned monitor's transaction history current. */
export function useTxHistory(
  address: MaybeRefOrGetter<string | null | undefined>,
  chainId: MaybeRefOrGetter<number | null | undefined>,
  monitor: MaybeRefOrGetter<TxMonitorLike | null | undefined>,
): UseTxHistoryReturn {
  const entries = shallowRef<TxStatusEntry[]>([]);
  const isLoading = shallowRef(false);
  const error = shallowRef<Error | null>(null);
  let generation = 0;

  const refresh = async (): Promise<void> => {
    const mine = ++generation;
    const activeMonitor = toValue(monitor);
    if (!activeMonitor) {
      entries.value = [];
      isLoading.value = false;
      error.value = null;
      return;
    }
    isLoading.value = true;
    error.value = null;
    try {
      const result = await activeMonitor.getTxHistory(
        toValue(address) ?? undefined,
        toValue(chainId) ?? undefined,
      );
      if (mine === generation) entries.value = result;
    } catch (err) {
      if (mine !== generation) return;
      error.value =
        err instanceof Error ? err : new Error("Failed to load transaction history");
    } finally {
      if (mine === generation) isLoading.value = false;
    }
  };

  watch(
    () => [toValue(monitor), toValue(address), toValue(chainId)] as const,
    ([activeMonitor], _previous, onCleanup) => {
      if (!activeMonitor) {
        void refresh();
        return;
      }
      const onStatusChange = (): void => {
        void refresh();
      };
      activeMonitor.on("statusChange", onStatusChange);
      onCleanup(() => activeMonitor.off("statusChange", onStatusChange));
      void refresh();
    },
    { immediate: true },
  );

  return {
    entries,
    isLoading,
    error,
    refresh,
    summary: computed(() => ({
      pending: entries.value.filter((item) => item.status === "pending").length,
      confirmed: entries.value.filter((item) => item.status === "confirmed").length,
      failed: entries.value.filter((item) => item.status === "failed").length,
    })),
  };
}
