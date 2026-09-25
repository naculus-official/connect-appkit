import type {
  GetRouteQuotes,
  RouteQuote,
  RouteQuoteInput,
} from "@naculus/connect-appkit-core";
import { describe, expect, it, vi } from "vitest";
import { nextTick, ref, watch } from "vue";
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

describe("useRouteQuote (Vue) input that permits no request", () => {
  function deferredQuotes() {
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
    return { answers, getQuotes };
  }

  it.each([
    ["empty", ""],
    ["unquotable", "0"],
  ])("drops a late result once the amount is %s", async (_label, amount) => {
    const { answers, getQuotes } = deferredQuotes();
    const current = ref<RouteQuoteInput>(input);
    const { api, scope } = inScope(() =>
      useRouteQuote(current, getQuotes, { debounceMs: 60_000 }),
    );

    const callA = api.refresh();
    expect(api.loading.value).toBe(true);
    current.value = { ...input, amount };
    await nextTick();
    expect(api.loading.value).toBe(false);
    expect(api.quotes.value).toEqual([]);

    answers[0]!.resolve([quote("late")]);
    await callA;
    expect(api.quotes.value).toEqual([]);
    expect(api.error.value).toBeNull();
    expect(api.loading.value).toBe(false);
    scope.stop();
  });

  it("drops a late failure once the input is emptied", async () => {
    const { answers, getQuotes } = deferredQuotes();
    const current = ref<RouteQuoteInput>(input);
    const { api, scope } = inScope(() =>
      useRouteQuote(current, getQuotes, { debounceMs: 60_000 }),
    );

    const callA = api.refresh();
    current.value = { ...input, fromToken: "" };
    await nextTick();
    expect(api.loading.value).toBe(false);

    answers[0]!.reject(new Error("stale"));
    await callA;
    expect(api.quotes.value).toEqual([]);
    expect(api.error.value).toBeNull();
    expect(api.loading.value).toBe(false);
    scope.stop();
  });

  it("stops loading without a quote function and keeps the last quotes", async () => {
    const { answers, getQuotes } = deferredQuotes();
    const fn = ref<GetRouteQuotes | null>(getQuotes);
    const { api, scope } = inScope(() =>
      useRouteQuote(input, fn, { debounceMs: 60_000 }),
    );

    const first = api.refresh();
    const shown = [quote("shown")];
    answers[0]!.resolve(shown);
    await first;

    const callA = api.refresh();
    expect(api.loading.value).toBe(true);
    fn.value = null;
    await nextTick();
    expect(api.loading.value).toBe(false);
    expect(api.quotes.value).toBe(shown);

    answers[1]!.resolve([quote("late")]);
    await callA;
    expect(api.quotes.value).toBe(shown);
    expect(api.error.value).toBeNull();
    expect(api.loading.value).toBe(false);
    scope.stop();
  });

  it("keeps the visible error when the input is emptied", async () => {
    const current = ref<RouteQuoteInput>(input);
    const { api, scope } = inScope(() =>
      useRouteQuote(current, () => Promise.reject(new Error("no route")), {
        debounceMs: 60_000,
      }),
    );
    await api.refresh();
    const visible = api.error.value;
    expect(visible?.message).toBe("no route");

    current.value = { ...input, amount: "" };
    await nextTick();
    expect(api.error.value).toBe(visible);
    expect(api.quotes.value).toEqual([]);
    expect(api.loading.value).toBe(false);
    scope.stop();
  });

  it("keeps B when A resolves after B for a changed valid input", async () => {
    const { answers, getQuotes } = deferredQuotes();
    const current = ref<RouteQuoteInput>(input);
    const { api, scope } = inScope(() =>
      useRouteQuote(current, getQuotes, { debounceMs: 60_000 }),
    );

    const callA = api.refresh();
    current.value = { ...input, amount: "2000000" };
    await nextTick();
    const callB = api.refresh();
    expect(getQuotes).toHaveBeenLastCalledWith(
      input.fromChain,
      input.toChain,
      input.fromToken,
      "2000000",
      undefined,
      undefined,
    );
    const newest = [quote("b")];
    answers[1]!.resolve(newest);
    await callB;
    answers[0]!.resolve([quote("a")]);
    await callA;
    expect(api.quotes.value).toBe(newest);
    expect(api.error.value).toBeNull();
    expect(api.loading.value).toBe(false);
    scope.stop();
  });
});
