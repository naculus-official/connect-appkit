import { describe, expect, it, vi } from "vitest";
import { effectScope } from "vue";
import type { SiwxResult } from "./siwx";
import { useSignInWithX } from "./useSignInWithX";

function signed(signature: string): SiwxResult {
  return {
    message: {
      chainId: "eip155:1",
      address: "0xabc",
      domain: "example.com",
    },
    signature,
  };
}

describe("useSignInWithX (Vue) stale results", () => {
  it("keeps the newest sign-in when an older one resolves last", async () => {
    const answers: Array<(value: SiwxResult) => void> = [];
    const action = vi.fn(
      () =>
        new Promise<SiwxResult>((resolve) => {
          answers.push(resolve);
        }),
    );
    const scope = effectScope();
    const state = scope.run(() => useSignInWithX(action))!;

    const callA = state.signIn({ domain: "example.com" });
    const callB = state.signIn({ domain: "example.com" });
    const newest = signed("0xB");
    answers[1]!(newest);
    await callB;
    answers[0]!(signed("0xA"));
    await callA;
    expect(state.result.value).toBe(newest);
    expect(state.isSigningIn.value).toBe(false);
    scope.stop();
  });
});
