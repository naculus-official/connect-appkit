import { describe, expect, it } from "vitest";
import { effectScope } from "vue";
import { useActionGuard } from "./action-guard";

describe("useActionGuard invalidate()", () => {
  it("stops an in-flight call from publishing but keeps the visible error", async () => {
    const scope = effectScope();
    const guard = scope.run(() => useActionGuard())!;
    await guard
      .run(() => Promise.reject(new Error("earlier")), "fallback")
      .catch(() => {});
    expect(guard.error.value?.message).toBe("earlier");

    let release!: () => void;
    let written = false;
    const pending = guard
      .run(async (commit) => {
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        commit(() => {
          written = true;
        });
        throw new Error("late");
      }, "fallback")
      .catch(() => {});
    guard.error.value = new Error("visible");
    guard.invalidate();
    release();
    await pending;
    expect(written).toBe(false);
    expect(guard.error.value?.message).toBe("visible");
    scope.stop();
  });
});
