import { describe, expect, it } from "vitest";
import { nextTick, ref } from "vue";
import {
  useTxMonitor,
  type TxMonitorLike,
  type TxStatusEntry,
} from "./useTxMonitor";

function entry(hash: string, status: TxStatusEntry["status"] = "pending"): TxStatusEntry {
  const now = Date.now();
  return {
    hash,
    chainId: 1,
    from: "0x" + "a".repeat(40),
    to: "0x" + "b".repeat(40),
    value: "0x0",
    status,
    createdAt: now,
    updatedAt: now,
    replacementCount: 0,
  };
}

class Monitor implements TxMonitorLike {
  readonly entries = new Map<string, TxStatusEntry>();
  readonly listeners = new Map<string, Set<(entry: TxStatusEntry) => void>>();
  stopped: string | null = null;

  async watchTx(hash: string, chainId: number): Promise<TxStatusEntry> {
    return this.getTxStatus(hash, chainId) ?? entry(hash);
  }
  stopWatching(hash: string, chainId?: number): void {
    this.stopped = `${chainId}:${hash}`;
  }
  getTxStatus(hash: string, chainId?: number): TxStatusEntry | null {
    return this.entries.get(`${chainId}:${hash}`) ?? null;
  }
  async getTxHistory(): Promise<TxStatusEntry[]> {
    return [...this.entries.values()];
  }
  async refreshTx(): Promise<void> {}
  on(event: "statusChange" | "confirmed" | "failed", listener: (next: TxStatusEntry) => void): this {
    const listeners = this.listeners.get(event) ?? new Set();
    listeners.add(listener);
    this.listeners.set(event, listeners);
    return this;
  }
  off(event: string, listener: Function): this {
    this.listeners.get(event)?.delete(listener as (next: TxStatusEntry) => void);
    return this;
  }
  emit(event: "statusChange" | "confirmed" | "failed", next: TxStatusEntry): void {
    this.listeners.get(event)?.forEach((listener) => listener(next));
  }
}

describe("useTxMonitor (Vue)", () => {
  it("watches the reactive hash and updates only for that transaction", async () => {
    const monitor = new Monitor();
    const hash = ref("0x" + "1".repeat(64));
    const initial = entry(hash.value);
    monitor.entries.set(`1:${hash.value}`, initial);
    const out = useTxMonitor(hash, 1, monitor);

    await nextTick();
    await Promise.resolve();
    expect(out.entry.value).toEqual(initial);
    expect(out.status.value).toBe("pending");
    expect(out.isWatching.value).toBe(true);

    monitor.emit("statusChange", entry("0x" + "2".repeat(64), "confirmed"));
    expect(out.status.value).toBe("pending");

    const confirmed = { ...initial, status: "confirmed" as const };
    monitor.emit("statusChange", confirmed);
    expect(out.entry.value).toEqual(confirmed);

    out.stopWatching();
    expect(monitor.stopped).toBe(`1:${hash.value}`);
    expect(out.isWatching.value).toBe(false);
  });

  it("clears an old result when the reactive hash becomes unavailable", async () => {
    const monitor = new Monitor();
    const hash = ref<string | null>("0x" + "3".repeat(64));
    const activeHash = hash.value!;
    monitor.entries.set(`1:${activeHash}`, entry(activeHash));
    const out = useTxMonitor(hash, 1, monitor);
    await nextTick();
    await Promise.resolve();
    expect(out.entry.value).not.toBeNull();

    hash.value = null;
    await nextTick();
    expect(out.entry.value).toBeNull();
    expect(out.status.value).toBe("idle");
  });
});
