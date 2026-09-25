import type { RouteQuote } from "@naculus/connect-appkit-core";
import { describe, expect, it, vi } from "vitest";
import { nextTick, watch } from "vue";
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

const input = {
  fromChain: "eip155:1",
  toChain: "eip155:10",
  fromToken: "USDC",
  amount: "1000000",
};

describe("useRouteQuote (Vue) stale results", () => {
  it("keeps the newest quote when an older request resolves last", async () => {
    const answers: Array<(quotes: RouteQuote[]) => void> = [];
    const getQuotes = vi.fn(
      () =>
        new Promise<RouteQuote[]>((resolve) => {
          answers.push(resolve);
        }),
    );
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

  it("clears loading only once a failure's error is visible", async () => {
    const seen: string[] = [];
    const { api, scope } = inScope(() => {
      const state = useRouteQuote(
        input,
        () => Promise.reject(new Error("no route")),
        { debounceMs: 60_000 },
      );
      const record = (flush: string) => (busy: boolean) => {
        if (!busy) seen.push(`${flush}:${state.error.value?.message ?? null}`);
      };
      watch(state.loading, record("sync"), { flush: "sync" });
      watch(state.loading, record("pre"));
      return state;
    });
    await api.refresh();
    await nextTick();
    expect(seen).toEqual(["sync:no route", "pre:no route"]);
    scope.stop();
  });

  it("drops an older failure that arrives after a newer quote", async () => {
    const answers: Array<{
      resolve: (quotes: RouteQuote[]) => void;
      reject: (cause: Error) => void;
    }> = [];
    const getQuotes = vi.fn(
      () =>
        new Promise<RouteQuote[]>((resolve, reject) => {
          answers.push({ resolve, reject });
        }),
    );
    const { api, scope } = inScope(() =>
      useRouteQuote(input, getQuotes, { debounceMs: 60_000 }),
    );

    const callA = api.refresh();
    const callB = api.refresh();
    const newest = [quote("b")];
    answers[1]!.resolve(newest);
    await callB;
    answers[0]!.reject(new Error("stale"));
    await callA;
    expect(api.quotes.value).toBe(newest);
    expect(api.error.value).toBeNull();
    expect(api.loading.value).toBe(false);
    scope.stop();
  });

  it("publishes nothing after disposal", async () => {
    const answers: Array<(quotes: RouteQuote[]) => void> = [];
    const getQuotes = vi.fn(
      () =>
        new Promise<RouteQuote[]>((resolve) => {
          answers.push(resolve);
        }),
    );
    const { api, scope } = inScope(() =>
      useRouteQuote(input, getQuotes, { debounceMs: 60_000 }),
    );
    const call = api.refresh();
    scope.stop();
    answers[0]!([quote("late")]);
    await call;
    expect(api.quotes.value).toEqual([]);
    expect(api.loading.value).toBe(true);
  });
});
