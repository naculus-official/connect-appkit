import { describe, expect, it, vi } from "vitest";
import { effectScope, nextTick, ref } from "vue";
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

  it("keeps the newest simulation when an older one resolves last", async () => {
    const calls: Array<{ resolve: () => void; reject: (e: Error) => void }> =
      [];
    const call = vi.fn(
      () =>
        new Promise<void>((resolve, reject) => {
          calls.push({ resolve, reject });
        }),
    );
    const scope = effectScope();
    const hook = scope.run(() =>
      useTransactionSimulation(tx, {
        chainId: 1,
        publicClient: { chain: { id: 1 }, call },
      }),
    )!;

    const callA = hook.simulate();
    const callB = hook.simulate();
    await vi.waitFor(() => expect(call).toHaveBeenCalledTimes(2));
    calls[1]!.resolve();
    await callB;
    expect(hook.result.value?.status).toBe("success");
    calls[0]!.reject(new Error("execution reverted"));
    await callA;
    expect(hook.result.value?.status).toBe("success");
    expect(hook.isSimulating.value).toBe(false);
    scope.stop();
  });

  it("keeps the visible error when simulating without a transaction", async () => {
    const transaction = ref<typeof tx | undefined>(tx);
    const scope = effectScope();
    const hook = scope.run(() => useTransactionSimulation(transaction))!;
    await expect(hook.simulate()).rejects.toThrow(/No chain/);
    const visible = hook.error.value;
    expect(visible).not.toBeNull();

    transaction.value = undefined;
    await nextTick(); // let the input watcher settle before the call
    const result = await hook.simulate();
    expect(result.status).toBe("unavailable");
    expect(hook.result.value).toBe(result);
    expect(hook.error.value).toBe(visible);
    expect(hook.isSimulating.value).toBe(false);
    scope.stop();
  });
});
