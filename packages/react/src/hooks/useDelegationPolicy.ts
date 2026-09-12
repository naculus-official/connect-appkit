"use client";

import {
  type AtomicityRequirement,
  type Hex,
  type ScopeCheckResult,
  type SessionKeyInfo,
  type SessionKeyManagerConfig,
  type SessionKeyScope,
  type SessionKeyTransaction,
  WalletError,
} from "@naculus/connect-core";
import { useCallback, useEffect, useState } from "react";
import { recoverMessageAddress } from "viem";
import { useAccount } from "./useAccount";
import { useDelegation } from "./useDelegation";
import {
  type ExecutionPreview,
  type UseExecuteCallsOptions,
  useExecuteCalls,
} from "./useExecuteCalls";
import { getSessionKeyManagerForHooks, useSessionKeys } from "./useSessionKeys";
import { useSignMessage } from "./useSignMessage";

export interface DelegationPolicyPreview {
  policy: SessionKeyInfo | null;
  scope: ScopeCheckResult;
  execution: ExecutionPreview;
  signerMatches: boolean;
  /** The stored signature still matches the persisted scope, signer, and origin. */
  authorizationVerified: boolean;
  /** Policy and route preflight passed; this does not imply broadcast. */
  ready: boolean;
  /** False until a session-signature-aware AA/7702 broadcaster is attached. */
  broadcastReady: boolean;
  /** The concrete on-chain route, when one has proved the policy is installed. */
  broadcastRoute: PolicyExecutionRoute | null;
  /** Whether that route has verified on-chain authorization for this policy. */
  onchainAuthorizationVerified: boolean;
  /** Guaranteed gas payer status for the configured broadcast route. */
  broadcastSponsored: boolean | null;
  /** Whether submission can proceed without invoking the main wallet again. */
  broadcastPromptless: boolean;
  reason: string;
}

export type PolicyExecutionRoute = "erc4337" | "eip7702";

export interface PolicyExecutionCheck {
  /** True only after the adapter has checked its live account/module state. */
  ready: boolean;
  /** True only when the session policy is enforceable by the target account. */
  authorizationInstalled: boolean;
  /** Whether this route guarantees the user will not pay gas. */
  sponsored: boolean;
  /** True only when submission does not invoke the main wallet again. */
  promptless: boolean;
  /** EIP-7702 delegate observed/configured by the adapter. */
  executorAddress?: `0x${string}`;
  reason: string;
}

export interface PreparedPolicyExecution {
  /** Exact digest the configured account/module validates on chain. */
  digest: Hex;
  /** Authoritative facts used for the final locked policy check. */
  transaction: SessionKeyTransaction;
  /** Adapter-private payload passed back unchanged for submission. */
  payload: unknown;
}

export interface PolicyExecutionSubmission {
  route: PolicyExecutionRoute;
  /** UserOperation hash for ERC-4337, transaction hash for EIP-7702. */
  hash: Hex;
  /** A hash proves submission, not inclusion. */
  status: "submitted";
}

/**
 * Account-specific bridge between a signed Naculus policy and on-chain code.
 *
 * ERC-4337 does not standardize session keys, and EIP-7702 only delegates code;
 * the selected account/module still defines the signature envelope and policy
 * storage. The adapter therefore has to prove that authorization is installed,
 * prepare the exact digest that code validates, and broadcast that same payload.
 */
export interface PolicyExecutionAdapter {
  route: PolicyExecutionRoute;
  check: (request: {
    policy: SessionKeyInfo;
    transaction: SessionKeyTransaction;
  }) => Promise<PolicyExecutionCheck>;
  prepare: (request: {
    policy: SessionKeyInfo;
    transaction: SessionKeyTransaction;
  }) => Promise<PreparedPolicyExecution>;
  broadcast: (request: {
    policy: SessionKeyInfo;
    prepared: PreparedPolicyExecution;
    signature: Hex;
  }) => Promise<PolicyExecutionSubmission>;
}

export interface UseDelegationPolicyOptions {
  /** Must include a host-provided encryptionKey before a policy can be created. */
  managerConfig?: SessionKeyManagerConfig;
  execution?: UseExecuteCallsOptions;
  /** Domain shown in the signed policy. Defaults to the browser origin. */
  origin?: string;
  /** Concrete AA-module or EIP-7702 executor for promptless submissions. */
  adapter?: PolicyExecutionAdapter;
}

export interface UseDelegationPolicyReturn {
  policies: SessionKeyInfo[];
  /** Active policies whose persisted signature still verifies. */
  activePolicies: SessionKeyInfo[];
  storageAvailable: boolean;
  loading: boolean;
  isBusy: boolean;
  error: Error | null;
  delegation: ReturnType<typeof useDelegation>;
  createPolicy: (scope: Partial<SessionKeyScope>) => Promise<SessionKeyInfo>;
  revokePolicy: (policyId: string) => Promise<void>;
  previewPolicyExecution: (
    policyId: string,
    tx: SessionKeyTransaction,
    callCount?: number,
    atomicity?: AtomicityRequirement,
  ) => Promise<DelegationPolicyPreview>;
  /**
   * Sign one 32-byte execution digest after enforcing the persisted policy.
   * This returns a signature only; an AA/7702 adapter must still broadcast it.
   */
  signPolicyDigest: (
    policyId: string,
    digest: `0x${string}`,
    tx: SessionKeyTransaction,
  ) => Promise<`0x${string}`>;
  /** Prepare, policy-check, session-sign, and submit one exact operation. */
  executePolicy: (
    policyId: string,
    tx: SessionKeyTransaction,
  ) => Promise<PolicyExecutionSubmission>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

function bareEvmAddress(account: string | null): `0x${string}` | null {
  const address = account?.includes(":") ? account.split(":").pop() : account;
  return address && /^0x[0-9a-fA-F]{40}$/.test(address)
    ? (address as `0x${string}`)
    : null;
}

function sorted(values: string[] | undefined): string[] | null {
  return values ? [...values].map((value) => value.toLowerCase()).sort() : null;
}

function sameExecutionIntent(
  requested: SessionKeyTransaction,
  prepared: SessionKeyTransaction,
): boolean {
  const sameAddress =
    requested.to === undefined ||
    requested.to.toLowerCase() === prepared.to?.toLowerCase();
  const sameData =
    requested.data === undefined ||
    requested.data.toLowerCase() === prepared.data?.toLowerCase();
  const sameQuantity = (left?: string, right?: string) => {
    if (left === undefined) return true;
    if (right === undefined) return false;
    try {
      return BigInt(left) === BigInt(right);
    } catch {
      return false;
    }
  };
  return (
    sameAddress &&
    sameData &&
    sameQuantity(requested.value, prepared.value) &&
    (requested.chainId === undefined || requested.chainId === prepared.chainId)
  );
}

/** Build the exact, deterministic message the main wallet authorizes. */
export function buildDelegationPolicyMessage(
  policy: SessionKeyInfo,
  origin: string,
): string {
  const tokenAllowances = policy.scope.tokenAllowances
    ? Object.entries(policy.scope.tokenAllowances)
        .map(
          ([token, value]) => [token.toLowerCase(), value.toString()] as const,
        )
        .sort(([left], [right]) => left.localeCompare(right))
    : null;
  const payload = {
    version: 1,
    origin,
    signer: policy.signerAddress.toLowerCase(),
    sessionId: policy.id,
    sessionPublicKey: policy.publicKey.toLowerCase(),
    expiresAt: new Date(policy.expiresAt).toISOString(),
    mode: policy.scope.mode,
    limits: {
      maxTotalGas: policy.scope.maxTotalGas?.toString() ?? null,
      maxGasPerTx: policy.scope.maxGasPerTx?.toString() ?? null,
      maxTotalValue: policy.scope.maxTotalValue?.toString() ?? null,
      maxValuePerTx: policy.scope.maxValuePerTx?.toString() ?? null,
      maxTxCount: policy.scope.maxTxCount ?? null,
    },
    allowedContracts: sorted(policy.scope.allowedContracts),
    allowedMethods: sorted(policy.scope.allowedMethods),
    allowedChainIds: policy.scope.allowedChainIds
      ? [...policy.scope.allowedChainIds].sort((left, right) => left - right)
      : null,
    tokenAllowances,
  };
  return `Naculus Session Policy v1\n${JSON.stringify(payload)}`;
}

/**
 * Complete product flow for local, signed, persistent session policies.
 *
 * This intentionally supports `offchain` mode only. Creating an EIP-7702 or
 * AA-module policy requires a real on-chain executor; accepting those modes
 * here would turn a local record into a false delegation claim.
 */
export function useDelegationPolicy(
  options: UseDelegationPolicyOptions = {},
): UseDelegationPolicyReturn {
  const { evmAccount } = useAccount();
  const signer = bareEvmAddress(evmAccount);
  const delegation = useDelegation();
  const execution = useExecuteCalls(options.execution);
  const { signMessage } = useSignMessage();
  const sessionKeys = useSessionKeys(options.managerConfig);
  const manager = getSessionKeyManagerForHooks(options.managerConfig);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [verifiedPolicyIds, setVerifiedPolicyIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isVerifying, setIsVerifying] = useState(false);
  const policyOrigin =
    options.origin ??
    (typeof window !== "undefined" ? window.location.origin : "unknown");

  const verifyStoredPolicy = useCallback(
    async (policy: SessionKeyInfo): Promise<boolean> => {
      if (
        policy.status !== "active" ||
        !policy.authorized ||
        policy.scope.mode !== "offchain"
      ) {
        return false;
      }
      const expectedMessage = buildDelegationPolicyMessage(
        policy,
        policyOrigin,
      );
      return manager.verifyOffchainAuthorization(
        policy.id,
        expectedMessage,
        async ({ message, signature, signerAddress }) => {
          const recovered = await recoverMessageAddress({ message, signature });
          return recovered.toLowerCase() === signerAddress.toLowerCase();
        },
      );
    },
    [manager, policyOrigin],
  );

  useEffect(() => {
    let cancelled = false;
    const candidates = sessionKeys.sessions.filter(
      (policy) =>
        policy.status === "active" &&
        policy.authorized &&
        policy.scope.mode === "offchain",
    );
    if (candidates.length === 0) {
      setVerifiedPolicyIds(new Set());
      setIsVerifying(false);
      return () => {
        cancelled = true;
      };
    }

    setIsVerifying(true);
    void Promise.all(
      candidates.map(
        async (policy) =>
          [policy.id, await verifyStoredPolicy(policy)] as const,
      ),
    )
      .then((results) => {
        if (!cancelled) {
          setVerifiedPolicyIds(
            new Set(
              results
                .filter(([, verified]) => verified)
                .map(([policyId]) => policyId),
            ),
          );
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setVerifiedPolicyIds(new Set());
          setError(
            cause instanceof Error
              ? cause
              : new Error("Policy verification failed"),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsVerifying(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionKeys.sessions, verifyStoredPolicy]);

  const clearError = useCallback(() => {
    setError(null);
    sessionKeys.clearError();
  }, [sessionKeys]);

  const createPolicy = useCallback(
    async (scope: Partial<SessionKeyScope>): Promise<SessionKeyInfo> => {
      if (!signer) {
        const next = new WalletError(
          "wallet_unavailable",
          "No active EVM account",
        );
        setError(next);
        throw next;
      }
      if (scope.mode && scope.mode !== "offchain") {
        const next = new WalletError(
          "method_not_allowed",
          "This flow creates signed off-chain policies only. EIP-7702 and AA-module policies require a configured on-chain execution adapter.",
        );
        setError(next);
        throw next;
      }
      if (!options.managerConfig?.encryptionKey) {
        const next = new WalletError(
          "method_not_allowed",
          "Persistent delegation policies require a host-provided encryptionKey. The deterministic compatibility fallback is not a production key boundary.",
        );
        setError(next);
        throw next;
      }
      if (!sessionKeys.storageAvailable) {
        const next = new WalletError(
          "storage_unavailable",
          "Persistent delegation policy storage is unavailable in this browser",
        );
        setError(next);
        throw next;
      }

      setIsBusy(true);
      setError(null);
      let draft: SessionKeyInfo | null = null;
      try {
        draft = await manager.createSessionKey(
          { ...scope, mode: "offchain" },
          signer,
        );
        const message = buildDelegationPolicyMessage(draft, policyOrigin);
        const signature = await signMessage(message);
        if (!/^0x[0-9a-fA-F]{130}$/.test(signature)) {
          throw new WalletError(
            "invalid_input",
            "Wallet did not return a valid 65-byte EVM policy signature",
          );
        }
        const recovered = await recoverMessageAddress({
          message,
          signature: signature as `0x${string}`,
        });
        if (recovered.toLowerCase() !== signer.toLowerCase()) {
          throw new WalletError(
            "invalid_input",
            "Policy signature does not recover to the connected EVM account",
          );
        }
        await manager.setAuthorization(draft.id, {
          signerAddress: signer,
          type: "offchain",
          rawSignature: signature as `0x${string}`,
          message,
        });
        const authorized = (await manager.listSessions()).find(
          (policy) => policy.id === draft?.id,
        );
        if (!authorized?.authorized) {
          throw new WalletError(
            "invalid_input",
            "Policy authorization was not persisted",
          );
        }
        if (!(await verifyStoredPolicy(authorized))) {
          throw new WalletError(
            "invalid_input",
            "Persisted policy signature did not verify against its stored scope and origin",
          );
        }
        await sessionKeys.refresh();
        return authorized;
      } catch (cause) {
        if (draft) {
          try {
            await manager.revokeSession(draft.id);
          } catch {
            // Preserve the signing/storage error that caused the rollback.
          }
        }
        const next =
          cause instanceof Error ? cause : new Error("Policy creation failed");
        setError(next);
        throw next;
      } finally {
        setIsBusy(false);
      }
    },
    [
      manager,
      options.managerConfig?.encryptionKey,
      policyOrigin,
      sessionKeys,
      signMessage,
      signer,
      verifyStoredPolicy,
    ],
  );

  const revokePolicy = useCallback(
    async (policyId: string) => {
      setIsBusy(true);
      setError(null);
      try {
        await manager.revokeSession(policyId);
        await sessionKeys.refresh();
      } catch (cause) {
        const next =
          cause instanceof Error
            ? cause
            : new Error("Policy revocation failed");
        setError(next);
        throw next;
      } finally {
        setIsBusy(false);
      }
    },
    [manager, sessionKeys],
  );

  const previewPolicyExecution = useCallback(
    async (
      policyId: string,
      tx: SessionKeyTransaction,
      callCount = 1,
      atomicity: AtomicityRequirement = "preferred",
    ): Promise<DelegationPolicyPreview> => {
      const policy =
        (await manager.listSessions()).find((item) => item.id === policyId) ??
        null;
      const scope = await manager.checkSessionScope(policyId, tx);
      const plan = execution.preview(callCount, atomicity);
      const authorizationVerified = policy
        ? await verifyStoredPolicy(policy)
        : false;
      const signerMatches = Boolean(
        policy &&
          signer &&
          policy.signerAddress.toLowerCase() === signer.toLowerCase(),
      );
      let adapterCheck: PolicyExecutionCheck | null = null;
      if (
        policy &&
        options.adapter &&
        authorizationVerified &&
        signerMatches &&
        scope.valid
      ) {
        try {
          adapterCheck = await options.adapter.check({
            policy,
            transaction: tx,
          });
        } catch (cause) {
          adapterCheck = {
            ready: false,
            authorizationInstalled: false,
            sponsored: false,
            promptless: false,
            reason:
              cause instanceof Error
                ? `Execution adapter check failed: ${cause.message}`
                : "Execution adapter check failed.",
          };
        }
      }
      const delegationMatches = Boolean(
        options.adapter?.route !== "eip7702" ||
          (delegation.delegated === true &&
            adapterCheck?.executorAddress &&
            delegation.delegate?.toLowerCase() ===
              adapterCheck.executorAddress.toLowerCase()),
      );
      const policyReady = Boolean(
        policy?.status === "active" &&
          policy.authorized &&
          authorizationVerified &&
          policy.scope.mode === "offchain" &&
          signerMatches &&
          scope.valid,
      );
      const adapterSponsorshipReady = Boolean(
        options.execution?.sponsorship !== "required" ||
          adapterCheck?.sponsored,
      );
      const broadcastReady = Boolean(
        policyReady &&
          callCount === 1 &&
          adapterCheck?.ready &&
          adapterCheck.authorizationInstalled &&
          adapterCheck.promptless &&
          adapterSponsorshipReady &&
          delegationMatches,
      );
      const ready = Boolean(policyReady && (plan.route || broadcastReady));
      const reason = !policy
        ? "Policy not found."
        : policy.status !== "active"
          ? `Policy is ${policy.status}.`
          : !policy.authorized
            ? "The main wallet has not signed this policy."
            : !authorizationVerified
              ? "The persisted policy signature no longer matches its scope, signer, or origin."
              : !signerMatches
                ? "The connected account is not the policy signer."
                : !scope.valid
                  ? (scope.reason ??
                    "The transaction is outside the policy scope.")
                  : broadcastReady
                    ? `The configured ${options.adapter?.route ?? "AA/7702"} adapter can submit this policy-authorized operation without another main-wallet prompt.${adapterCheck?.sponsored ? " Gas sponsorship is guaranteed." : ""} ${adapterCheck?.reason ?? "The on-chain execution adapter is ready."}`
                    : !options.adapter
                      ? `${plan.reason} The signed off-chain policy permits this request; an AA/7702 adapter is still required to broadcast without another wallet prompt.`
                      : !adapterCheck?.ready ||
                          !adapterCheck.authorizationInstalled
                        ? `${plan.reason} ${adapterCheck?.reason ?? "The execution adapter is not ready."}`
                        : !adapterCheck.promptless
                          ? `${plan.reason} The configured adapter would invoke the main wallet again, so promptless broadcast is not ready.`
                          : !adapterSponsorshipReady
                            ? `${plan.reason} Sponsored gas is required, but the configured adapter does not guarantee sponsorship.`
                            : callCount !== 1
                              ? `${plan.reason} This policy adapter prepares one execution at a time and cannot claim a multi-call broadcast.`
                              : !delegationMatches
                                ? `${plan.reason} The configured EIP-7702 executor does not match the account's on-chain delegation.`
                                : !plan.route
                                  ? plan.reason
                                  : `${plan.reason} ${adapterCheck.reason}`;
      return {
        policy,
        scope,
        execution: plan,
        signerMatches,
        authorizationVerified,
        ready,
        broadcastReady,
        broadcastRoute: broadcastReady
          ? (options.adapter?.route ?? null)
          : null,
        onchainAuthorizationVerified: Boolean(
          adapterCheck?.authorizationInstalled && delegationMatches,
        ),
        broadcastSponsored: broadcastReady
          ? (adapterCheck?.sponsored ?? false)
          : null,
        broadcastPromptless: Boolean(
          broadcastReady && adapterCheck?.promptless,
        ),
        reason,
      };
    },
    [
      delegation,
      execution,
      manager,
      options.adapter,
      options.execution?.sponsorship,
      signer,
      verifyStoredPolicy,
    ],
  );

  const signPolicyDigest = useCallback(
    async (
      policyId: string,
      digest: `0x${string}`,
      tx: SessionKeyTransaction,
    ) => {
      const preview = await previewPolicyExecution(policyId, tx, 1, "any");
      if (!preview.ready) {
        throw new WalletError("method_not_allowed", preview.reason);
      }
      return manager.signWithVerifiedOffchainAuthorization(
        policyId,
        (authoritativePolicy) =>
          buildDelegationPolicyMessage(authoritativePolicy, policyOrigin),
        async ({ message, signature, signerAddress }) => {
          const recovered = await recoverMessageAddress({ message, signature });
          return recovered.toLowerCase() === signerAddress.toLowerCase();
        },
        digest,
        tx,
      );
    },
    [manager, policyOrigin, previewPolicyExecution],
  );

  const executePolicy = useCallback(
    async (policyId: string, tx: SessionKeyTransaction) => {
      const adapter = options.adapter;
      if (!adapter) {
        throw new WalletError(
          "method_not_allowed",
          "No session-policy-aware AA/7702 execution adapter is configured.",
        );
      }
      setIsBusy(true);
      setError(null);
      try {
        const preview = await previewPolicyExecution(policyId, tx, 1, "any");
        if (!preview.broadcastReady || !preview.policy) {
          throw new WalletError("method_not_allowed", preview.reason);
        }
        const prepared = await adapter.prepare({
          policy: preview.policy,
          transaction: tx,
        });
        if (!/^0x[0-9a-fA-F]{64}$/.test(prepared.digest)) {
          throw new WalletError(
            "invalid_input",
            "Execution adapter returned a digest that is not 32 bytes.",
          );
        }
        if (!sameExecutionIntent(tx, prepared.transaction)) {
          throw new WalletError(
            "invalid_input",
            "Execution adapter changed the requested target, value, data, or chain.",
          );
        }

        // Re-check live adapter/module state immediately before the locked
        // policy verification and signing step. The earlier preview is UI;
        // this check is authorization.
        const currentCheck = await adapter.check({
          policy: preview.policy,
          transaction: prepared.transaction,
        });
        const currentDelegationMatches =
          adapter.route !== "eip7702" ||
          (delegation.delegated === true &&
            currentCheck.executorAddress !== undefined &&
            delegation.delegate?.toLowerCase() ===
              currentCheck.executorAddress.toLowerCase());
        if (
          !currentCheck.ready ||
          !currentCheck.authorizationInstalled ||
          !currentCheck.promptless ||
          (options.execution?.sponsorship === "required" &&
            !currentCheck.sponsored) ||
          !currentDelegationMatches
        ) {
          throw new WalletError(
            "method_not_allowed",
            currentCheck.reason ||
              "The on-chain policy authorization is not ready.",
          );
        }

        const signature = await manager.signWithVerifiedOffchainAuthorization(
          policyId,
          (authoritativePolicy) =>
            buildDelegationPolicyMessage(authoritativePolicy, policyOrigin),
          async ({ message, signature: authorization, signerAddress }) => {
            const recovered = await recoverMessageAddress({
              message,
              signature: authorization,
            });
            return recovered.toLowerCase() === signerAddress.toLowerCase();
          },
          prepared.digest,
          prepared.transaction,
        );
        const submission = await adapter.broadcast({
          policy: preview.policy,
          prepared,
          signature,
        });
        if (
          submission.route !== adapter.route ||
          submission.status !== "submitted" ||
          !/^0x[0-9a-fA-F]{64}$/.test(submission.hash)
        ) {
          throw new WalletError(
            "invalid_input",
            "Execution adapter returned an invalid submission result.",
          );
        }
        await sessionKeys.refresh();
        return submission;
      } catch (cause) {
        const next =
          cause instanceof Error ? cause : new Error("Policy execution failed");
        setError(next);
        throw next;
      } finally {
        setIsBusy(false);
      }
    },
    [
      delegation,
      manager,
      options.adapter,
      options.execution?.sponsorship,
      policyOrigin,
      previewPolicyExecution,
      sessionKeys,
    ],
  );

  const activePolicies = sessionKeys.activeSessions.filter((policy) =>
    verifiedPolicyIds.has(policy.id),
  );

  return {
    policies: sessionKeys.sessions,
    activePolicies,
    storageAvailable: sessionKeys.storageAvailable,
    loading: sessionKeys.loading || isVerifying,
    isBusy,
    error: error ?? sessionKeys.error,
    delegation,
    createPolicy,
    revokePolicy,
    previewPolicyExecution,
    signPolicyDigest,
    executePolicy,
    refresh: sessionKeys.refresh,
    clearError,
  };
}
