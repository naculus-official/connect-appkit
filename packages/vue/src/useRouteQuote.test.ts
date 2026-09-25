import type { RouteQuote } from "@naculus/connect-appkit-core";
import { describe, expect, it, vi } from "vitest";
import { inScope } from "../test-utils/scope";
import { useRouteQuote } from "./useRouteQuote";

function quote(routeId: string): RouteQuote {
  return {
    routeId,
    provider: "p",
    netReceiveFormatted: "9.9",
    toTokenSymbol: "USDC",
  };
}

describe("useRouteQuote (Vue) stale results", () => {
  it("keeps the newest quote when an older request resolves last", async () => {
    const answers: Array<(quotes: RouteQuote[]) => void> = [];
    const getQuotes = vi.fn(
      () =>
        new Promise<RouteQuote[]>((resolve) => {
          answers.push(resolve);
        }),
    );
    const input = {
      fromChain: "eip155:1",
      toChain: "eip155:10",
      fromToken: "USDC",
      amount: "1000000",
    };
    // A long debounce keeps the automatic fetch out of the way.
    const { api, scope } = inScope(() =>
      useRouteQuote(input, getQuotes, { debounceMs: 60_000 }),
    );

    const callA = api.refresh();
    const callB = api.refresh();
    const newest = [quote("b")];
    answers[1]!(newest);
    await callB;
    answers[0]!([quote("a")]);
    await callA;
    expect(api.quotes.value).toBe(newest);
    expect(api.loading.value).toBe(false);
    scope.stop();
  });
});
