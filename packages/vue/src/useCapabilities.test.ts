import { describe, expect, it, vi } from "vitest";
import { nextTick, ref } from "vue";
import { useCapabilities } from "./useCapabilities";

const SESSION = { id: "session-1" };

function clientReturning(raw: Record<string, unknown>) {
  return { getCapabilities: vi.fn(async () => raw) };
}

/** watchEffect fires synchronously, but the query inside it is async. */
const settled = async () => {
  await nextTick();
  await Promise.resolve();
  await Promise.resolve();
};

describe("useCapabilities (Vue)", () => {
  it("reports atomic support the wallet confirmed", async () => {
    const client = clientReturning({
      "eip155:1": { atomic: { status: "supported" } },
    });
    const { atomic, current } = useCapabilities(client, SESSION, "eip155:1");
    await settled();

    expect(atomic.value).toBe("supported");
    expect(current.value?.chainId).toBe("eip155:1");
  });

  /**
   * The rule the whole three-state type exists for, and the one a second
   * implementation would most likely get wrong. A wallet with no entry for
   * this chain has not refused — it has said nothing.
   */
  it("says unknown for a chain the wallet did not mention", async () => {
    const client = clientReturning({
      "eip155:1": { atomic: { status: "supported" } },
    });
    const { atomic } = useCapabilities(client, SESSION, "eip155:137");
    await settled();

    expect(atomic.value).toBe("unknown");
  });

  it("says unknown before any query has returned", () => {
    const client = clientReturning({});
    const { atomic, capabilities } = useCapabilities(
      client,
      SESSION,
      "eip155:1",
    );
    expect(atomic.value).toBe("unknown");
    expect(capabilities.value).toBeNull();
  });

  it("finds an entry a wallet keyed by hex rather than CAIP-2", async () => {
    const client = clientReturning({ "0x1": { atomic: { status: "ready" } } });
    const { atomic } = useCapabilities(client, SESSION, "eip155:1");
    await settled();

    expect(atomic.value).toBe("supported");
  });

  it("clears the map on failure rather than leaving a previous wallet's answer", async () => {
    const client = {
      getCapabilities: vi.fn(async () => {
        throw new Error("wallet said no");
      }),
    };
    const { capabilities, atomic, error } = useCapabilities(
      client,
      SESSION,
      "eip155:1",
    );
    await settled();

    expect(capabilities.value).toBeNull();
    expect(atomic.value).toBe("unknown");
    expect(error.value?.message).toBe("wallet said no");
  });

  it("does not query without a session", async () => {
    const client = clientReturning({
      "eip155:1": { atomic: { status: "supported" } },
    });
    const { atomic } = useCapabilities(client, null, "eip155:1");
    await settled();

    expect(client.getCapabilities).not.toHaveBeenCalled();
    expect(atomic.value).toBe("unknown");
  });

  it("re-queries when the session changes", async () => {
    const client = clientReturning({
      "eip155:1": { atomic: { status: "supported" } },
    });
    const session = ref<unknown>(null);
    useCapabilities(client, session, "eip155:1");
    await settled();
    expect(client.getCapabilities).not.toHaveBeenCalled();

    session.value = SESSION;
    await settled();
    expect(client.getCapabilities).toHaveBeenCalledTimes(1);
  });

  /**
   * Switching chain selects from an answer already held. Re-querying the
   * wallet for it would be a prompt the user did not ask for.
   */
  it("follows a chain change without querying again", async () => {
    const client = clientReturning({
      "eip155:1": { atomic: { status: "supported" } },
      "eip155:137": { atomic: { status: "unsupported" } },
    });
    const chainId = ref("eip155:1");
    const { atomic } = useCapabilities(client, SESSION, chainId);
    await settled();
    expect(atomic.value).toBe("supported");

    chainId.value = "eip155:137";
    await nextTick();
    expect(atomic.value).toBe("unsupported");
    expect(client.getCapabilities).toHaveBeenCalledTimes(1);
  });
});
