/**
 * useSmartAccount
 *
 * React hook for ERC-4337 Smart Account lifecycle management.
 * Provides create, deploy, and address lookup for smart contract wallets.
 *
 * @example
 * ```tsx
 * const { address, isDeployed, createWallet, deployWallet, isLoading } = useSmartAccount({
 *   rpcUrl: "https://eth.llamarpc.com",
 *   bundlerUrl: "https://api.pimlico.io/v2/1/rpc?apikey=...",
 * });
 * ```
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useAccount } from "./useAccount";
import type {
  SmartAccountInfo,
  SmartAccountConfig,
  Address,
} from "@naculus/connect-core";

export interface UseSmartAccountOptions {
  /** RPC URL for the target chain */
  rpcUrl?: string;
  /** Bundler RPC URL */
  bundlerUrl?: string;
  /** Chain ID (CAIP-2 format) */
  chainId?: string;
  /** Account type (default: "simple") */
  accountType?: "simple" | "light" | "kernel" | "safe";
  /** Optional salt for deterministic address */
  salt?: bigint;
}

export interface UseSmartAccountReturn {
  /** Smart account address (null if not created) */
  address: Address | null;
  /** Whether the account is deployed on-chain */
  isDeployed: boolean;
  /** Smart account info object */
  accountInfo: SmartAccountInfo | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Create a new smart account (compute address) */
  createWallet: () => Promise<SmartAccountInfo | null>;
  /** Deploy the smart account to chain */
  deployWallet: () => Promise<Address | null>;
  /** Get the counterfactual address without creating */
  getAddress: () => Promise<Address | null>;
}

/**
 * Hook for managing a ERC-4337 Smart Contract Wallet lifecycle.
 *
 * @param options - Smart account configuration options
 * @returns Smart account state and actions
 */
export function useSmartAccount(options?: UseSmartAccountOptions): UseSmartAccountReturn {
  const { evmAccount } = useAccount();
  const [address, setAddress] = useState<Address | null>(null);
  const [isDeployed, setIsDeployed] = useState(false);
  const [accountInfo, setAccountInfo] = useState<SmartAccountInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const managerRef = useRef<import("@naculus/connect-core").SmartAccountManager | null>(null);

  // Initialize SmartAccountManager on config change (with cleanup to prevent race conditions)
  useEffect(() => {
    if (!options?.rpcUrl) {
      managerRef.current = null;
      return;
    }

    let cancelled = false;

    import("@naculus/connect-core").then(({ SmartAccountManager }) => {
      if (cancelled) return; // prevent stale state update
      managerRef.current = new SmartAccountManager({
        rpcUrl: options.rpcUrl!,
        chainId: options.chainId ?? "eip155:1",
        bundlerClient: {
          url: options.bundlerUrl ?? "",
        },
      });
    }).catch((err) => {
      if (cancelled) return; // prevent stale state update
      setError(err instanceof Error ? err : new Error("Failed to load account-abstraction module"));
    });

    return () => { cancelled = true; };
  }, [options?.rpcUrl, options?.bundlerUrl, options?.chainId]);

  // Get account config from options + connected EOA
  const getConfig = useCallback((): SmartAccountConfig | null => {
    const owner = evmAccount;
    if (!owner || !managerRef.current) return null;

    const address = owner.includes(":") ? owner.split(":").pop()! as Address : owner as Address;

    return {
      owner: address,
      accountType: options?.accountType ?? "simple",
      entryPoint: "0x0000000071727De22E5E9d8BAf0edAc6f37da032" as Address, // v0.7
      chainId: options?.chainId ?? "eip155:1",
      salt: options?.salt,
    };
  }, [evmAccount, options?.accountType, options?.chainId, options?.salt]);

  // Create wallet (compute counterfactual address)
  const createWallet = useCallback(async (): Promise<SmartAccountInfo | null> => {
    const config = getConfig();
    if (!config || !managerRef.current) {
      setError(new Error("Smart account not configured"));
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const info = await managerRef.current.createAccount(config);
      setAddress(info.address);
      setIsDeployed(info.isDeployed);
      setAccountInfo(info);
      return info;
    } catch (err) {
      const e = err instanceof Error ? err : new Error("Failed to create smart account");
      setError(e);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getConfig]);

  // Deploy wallet
  const deployWallet = useCallback(async (): Promise<Address | null> => {
    const config = getConfig();
    if (!config || !managerRef.current) {
      setError(new Error("Smart account not configured"));
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const deployResult = await managerRef.current.deployAccount(config);

      // After deploy, update state
      if (deployResult) {
        const info = await managerRef.current.createAccount(config);
        setAddress(info.address);
        setIsDeployed(true);
        setAccountInfo(info);
      }

      return deployResult;
    } catch (err) {
      const e = err instanceof Error ? err : new Error("Failed to deploy smart account");
      setError(e);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getConfig]);

  // Get counterfactual address
  const getAddress = useCallback(async (): Promise<Address | null> => {
    const config = getConfig();
    if (!config || !managerRef.current) return null;

    try {
      const addr = await managerRef.current.getAccountAddress(config);
      return addr;
    } catch {
      return null;
    }
  }, [getConfig]);

  return {
    address,
    isDeployed,
    accountInfo,
    isLoading,
    error,
    createWallet,
    deployWallet,
    getAddress,
  };
}
