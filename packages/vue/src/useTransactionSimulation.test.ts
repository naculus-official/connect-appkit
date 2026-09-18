import { describe, expect, it, vi } from "vitest";
import { effectScope, ref } from "vue";
import { useTransactionSimulation } from "./useTransactionSimulation";

const tx = { to: `0x${"1".repeat(40)}` };

describe("useTransactionSimulation", () => {
  it("rejects an unknown chain and uses explicit client context", async () => {
    const scope = effectScope();
    const chainId = ref<number>();
    const call = vi.fn().mockResolvedValue({});
    const hook = scope.run(() =>
      useTransactionSimulation(tx, {
        chainId,
        publicClient: { chain: { id: 1 }, call },
      }),
    )!;
    await expect(hook.simulate()).rejects.toThrow(/No chain/);
    chainId.value = 1;
    const result = await hook.simulate();
    expect(result.status).toBe("success");
    expect(call).toHaveBeenCalledOnce();
    scope.stop();
  });

  it("debounces input changes and drops a late result after disposal", async () => {
    vi.useFakeTimers();
    try {
      let finish!: (value: unknown) => void;
      const call = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      );
      const transaction = ref(tx);
      const scope = effectScope();
      const hook = scope.run(() =>
        useTransactionSimulation(transaction, {
          chainId: 1,
          publicClient: { chain: { id: 1 }, call },
        }),
      )!;
      transaction.value = { to: `0x${"2".repeat(40)}` };
      await vi.advanceTimersByTimeAsync(300);
      expect(call).toHaveBeenCalledOnce();
      scope.stop();
      finish({});
      await Promise.resolve();
      expect(hook.result.value).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it("invalidates an in-flight preview as soon as inputs change", async () => {
    vi.useFakeTimers();
    try {
      let finish!: (value: unknown) => void;
      const call = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      );
      const transaction = ref(tx);
      const scope = effectScope();
      const hook = scope.run(() =>
        useTransactionSimulation(transaction, {
          chainId: 1,
          publicClient: { chain: { id: 1 }, call },
        }),
      )!;
      await vi.advanceTimersByTimeAsync(300);
      expect(call).toHaveBeenCalledOnce();
      transaction.value = { to: `0x${"3".repeat(40)}` };
      await vi.advanceTimersByTimeAsync(0);
      finish({});
      await Promise.resolve();
      expect(hook.result.value).toBeUndefined();
      scope.stop();
    } finally {
      vi.useRealTimers();
    }
  });
});
