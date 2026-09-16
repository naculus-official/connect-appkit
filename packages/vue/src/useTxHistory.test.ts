import { describe, expect, it } from "vitest";
import { nextTick, ref } from "vue";
import { useTxHistory } from "./useTxHistory";
import type { TxMonitorLike, TxStatusEntry } from "./useTxMonitor";

class Monitor implements TxMonitorLike {
  entries: TxStatusEntry[] = [];
  private listeners = new Set<(entry: TxStatusEntry) => void>();
  async watchTx(): Promise<TxStatusEntry> { throw new Error("unused"); }
  stopWatching(): void {}
  getTxStatus(): TxStatusEntry | null { return null; }
  async getTxHistory(): Promise<TxStatusEntry[]> { return this.entries; }
  async refreshTx(): Promise<void> {}
  on(event: "statusChange" | "confirmed" | "failed", listener: (entry: TxStatusEntry) => void): this {
    if (event === "statusChange") this.listeners.add(listener);
    return this;
  }
  off(event: string, listener: Function): this {
    if (event === "statusChange") this.listeners.delete(listener as (entry: TxStatusEntry) => void);
    return this;
  }
  emitStatus(): void {
    this.listeners.forEach((listener) => listener(this.entries[0]!));
  }
}

function entry(status: TxStatusEntry["status"]): TxStatusEntry {
  const now = Date.now();
  return {
    hash: "0x" + status.padEnd(64, "0"),
    chainId: 1,
    from: "", to: "", value: "0x0", status,
    createdAt: now, updatedAt: now, replacementCount: 0,
  };
}

describe("useTxHistory (Vue)", () => {
  it("loads history and refreshes it after a status change", async () => {
    const monitor = new Monitor();
    monitor.entries = [entry("pending"), entry("confirmed")];
    const out = useTxHistory(ref(undefined), ref(1), monitor);
    await nextTick();
    await Promise.resolve();
    expect(out.entries.value).toHaveLength(2);
    expect(out.summary.value).toEqual({ pending: 1, confirmed: 1, failed: 0 });

    monitor.entries = [entry("failed")];
    monitor.emitStatus();
    await Promise.resolve();
    expect(out.summary.value).toEqual({ pending: 0, confirmed: 0, failed: 1 });
  });
});
