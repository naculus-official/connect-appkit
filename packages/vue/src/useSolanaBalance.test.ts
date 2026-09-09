import { afterEach, describe, expect, it, vi } from "vitest";
import { effectScope, nextTick, ref } from "vue";
import { useSolanaBalance } from "./useSolanaBalance";

const ADDRESS = "HAgk14CToKGpm4rGCyVc5J8mQCGGvaJfYSxUJZ8AXfBW";

function rpc(...responses: unknown[]) {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    json: async () => responses.shift() ?? { result: { value: null } },
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function inScope<T>(fn: () => T) {
  const scope = effectScope();
  let api!: T;
  scope.run(() => {
    api = fn();
  });
  return { api, scope };
}

afterEach(() => vi.unstubAllGlobals());

describe("useSolanaBalance (Vue)", () => {
  it("reads a balance through the shared core", async () => {
    rpc({ result: { value: 2_500_000_000 } }, { result: { value: {} } });
    const { api } = inScope(() =>
      useSolanaBalance(ADDRESS, "https://rpc.test"),
    );
    await vi.waitFor(() => expect(api.balance.value).not.toBeNull());
    // Exactly what the React hook produces for the same response — the
    // formatting is the shared core's, not this file's.
    expect(api.balance.value?.sol).toBe("2.5");
  });

  it("re-reads when the address ref changes", async () => {
    const fetchMock = rpc(
      { result: { value: 1_000_000_000 } },
      { result: { value: {} } },
      { result: { value: 3_000_000_000 } },
      { result: { value: {} } },
    );
    const address = ref<string | null>(ADDRESS);
    const { api } = inScope(() =>
      useSolanaBalance(address, "https://rpc.test"),
    );
    await vi.waitFor(() => expect(api.balance.value?.sol).toBe("1"));

    address.value = "OtherAddress";
    await nextTick();
    await vi.waitFor(() => expect(api.balance.value?.sol).toBe("3"));
    expect(fetchMock).toHaveBeenCalled();
  });

  it("does nothing without an address or an endpoint", async () => {
    const fetchMock = rpc();
    inScope(() => useSolanaBalance(null, "https://rpc.test"));
    inScope(() => useSolanaBalance(ADDRESS, null));
    await nextTick();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("clears the balance on failure rather than leaving it stale", async () => {
    rpc({ result: { value: 5_000_000_000 } }, { result: { value: {} } });
    const { api } = inScope(() =>
      useSolanaBalance(ADDRESS, "https://rpc.test"),
    );
    await vi.waitFor(() => expect(api.balance.value?.sol).toBe("5"));

    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500 })));
    await api.refetch();
    expect(api.error.value).not.toBeNull();
    expect(api.balance.value).toBeNull();
  });

  // A response arriving after the component is gone must not write into it.
  it("stops writing after the scope is disposed", async () => {
    let release!: (v: unknown) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise((r) => { release = r; })),
    );
    const { api, scope } = inScope(() =>
      useSolanaBalance(ADDRESS, "https://rpc.test"),
    );
    scope.stop();
    release({ ok: true, json: async () => ({ result: { value: 1 } }) });
    await nextTick();
    expect(api.balance.value).toBeNull();
  });
});
