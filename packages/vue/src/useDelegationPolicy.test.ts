import { buildDelegationPolicyMessage } from "@naculus/connect-appkit-core";
import { MemoryStorageAdapter, SessionKeyManager } from "@naculus/connect-core";
import { describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { inScope } from "../test-utils/scope";
import { useDelegationPolicy } from "./useDelegationPolicy";

const SIGNER = "0x2222222222222222222222222222222222222222" as const;
const CONTRACT = "0x1111111111111111111111111111111111111111" as const;
const SIG = `0x${"11".repeat(65)}` as const;

describe("useDelegationPolicy (Vue)", () => {
  it("creates a verified policy through caller-owned signer/verifier and lists it as active", async () => {
    const manager = new SessionKeyManager(
      { pbkdf2Iterations: 1_000, unsafeAllowWeakKdf: true, encryptionKey: "k" },
      new MemoryStorageAdapter(),
    );
    const signMessage = vi.fn(async () => SIG);
    const connected = ref(true);
    const { api } = inScope(() =>
      useDelegationPolicy({
        account: `eip155:1:${SIGNER}`,
        connected,
        signMessage,
        verifySignature: async ({ signerAddress }) => signerAddress === SIGNER,
        previewExecution: () => ({
          strategy: "sequential",
          atomic: false,
          sponsored: false,
          reason: "plan",
          route: "sequential",
        }),
        delegation: { delegated: null, delegate: null },
        managerConfig: { encryptionKey: "k" },
        manager,
        origin: "https://app.test",
      }),
    );

    const policy = await api.createPolicy({ allowedContracts: [CONTRACT] });
    expect(signMessage).toHaveBeenCalledWith(
      buildDelegationPolicyMessage(policy, "https://app.test"),
    );
    await vi.waitFor(() => expect(api.activePolicies.value).toHaveLength(1));
    expect(api.loading.value).toBe(false);
    expect(api.isBusy.value).toBe(false);

    const preview = await api.previewPolicyExecution(policy.id, {
      to: CONTRACT,
    });
    expect(preview.ready).toBe(true);

    await api.revokePolicy(policy.id);
    await vi.waitFor(() => expect(api.activePolicies.value).toHaveLength(0));
  });

  it("surfaces a refused creation without invoking the signer", async () => {
    const signMessage = vi.fn(async () => SIG);
    const { api } = inScope(() =>
      useDelegationPolicy({
        account: null,
        connected: true,
        signMessage,
        verifySignature: async () => true,
        previewExecution: () => ({
          strategy: "refuse",
          atomic: false,
          sponsored: false,
          reason: "no",
          route: null,
        }),
        delegation: { delegated: null, delegate: null },
        managerConfig: { encryptionKey: "k" },
        manager: new SessionKeyManager(
          {
            pbkdf2Iterations: 1_000,
            unsafeAllowWeakKdf: true,
            encryptionKey: "k",
          },
          new MemoryStorageAdapter(),
        ),
      }),
    );
    await expect(
      api.createPolicy({ allowedContracts: [CONTRACT] }),
    ).rejects.toMatchObject({
      code: "wallet_unavailable",
    });
    expect(signMessage).not.toHaveBeenCalled();
    expect(api.error.value).toMatchObject({ code: "wallet_unavailable" });
    api.clearError();
    expect(api.error.value).toBeNull();
  });
});
