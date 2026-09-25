import type { CostComparison } from "@naculus/connect-appkit-core";
import { describe, expect, it, vi } from "vitest";
import { inScope } from "../test-utils/scope";
import { useCompareCosts } from "./useCompareCosts";

function comparison(chain: string): CostComparison {
  return {
    chain,
    chainName: chain,
    totalCost: "1",
    gasCost: "1",
    estimatedTimeMs: 1,
  } as CostComparison;
}

describe("useCompareCosts (Vue) stale results", () => {
  it("keeps the newest comparison when an older request resolves last", async () => {
    const answers: Array<(rows: CostComparison[]) => void> = [];
    const compare = vi.fn(
      () =>
        new Promise<CostComparison[]>((resolve) => {
          answers.push(resolve);
        }),
    );
    const { api, scope } = inScope(() =>
      useCompareCosts({ operation: "swap", chains: ["eip155:1"] }, compare),
    );

    const callA = api.refresh();
    const callB = api.refresh();
    const newest = [comparison("eip155:10")];
    answers[2]!(newest);
    await callB;
    answers[1]!([comparison("eip155:1")]);
    answers[0]!([comparison("eip155:1")]);
    await callA;
    expect(api.comparisons.value).toBe(newest);
    expect(api.loading.value).toBe(false);
    scope.stop();
  });

  it("publishes nothing after disposal", async () => {
    const answers: Array<(rows: CostComparison[]) => void> = [];
    const compare = vi.fn(
      () =>
        new Promise<CostComparison[]>((resolve) => {
          answers.push(resolve);
        }),
    );
    const { api, scope } = inScope(() =>
      useCompareCosts({ operation: "swap", chains: ["eip155:1"] }, compare),
    );
    const call = api.refresh();
    scope.stop();
    answers[0]!([comparison("eip155:1")]);
    answers[1]!([comparison("eip155:1")]);
    await call;
    expect(api.comparisons.value).toEqual([]);
    expect(api.loading.value).toBe(true);
  });
});
