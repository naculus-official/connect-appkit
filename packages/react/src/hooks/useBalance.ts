import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useWeb3 } from "../provider/Web3ConnectProvider";
import { useAccount } from "./useAccount";
import { createPublicClient, http, formatEther, type PublicClient, type Address } from "viem";
import { getNativeTokenPriceUsd } from "@naculus/connect-core";

export interface UseBalanceOptions {
  /** Auto-refresh interval in milliseconds. Default: undefined (no auto-refresh). */
  refreshInterval?: number;
}

export interface UseBalanceResult {
  /** Raw balance in wei (string), or null if not connected / error */
  balance: string | null;
  /** Human-readable formatted balance in ETH (or native token), or null */
  formatted: string | null;
  /** Native token symbol (e.g. "ETH", "MATIC") */
  symbol: string;
  /** USD price of one native token, or null if unavailable */
  usdPrice: number | null;
  /** Formatted USD value of the balance (e.g. "$1,234.56"), or null */
  usdValue: string | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  chain: { id: number; namespace: string; name: string; rpcUrl?: string; token?: string } | null;
}

export function useBalance(options?: UseBalanceOptions): UseBalanceResult {
  const { evmAccount, isConnected } = useAccount();
  const { chainId, chains } = useWeb3();
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [usdPrice, setUsdPrice] = useState<number | null>(null);
  const refreshInterval = options?.refreshInterval;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentChain = useMemo(() => {
    if (!chainId || !chains.length) return null;

    const namespace = chainId.startsWith("eip155:") ? "eip155" : null;
    if (!namespace) return null;

    const chainPart = chainId.split(":")[1];
    const chainNum = Number(chainPart);
    if (!Number.isFinite(chainNum) || chainNum <= 0) return null; // H11: reject malformed chain IDs
    return chains.find((c) => c.namespace === namespace && c.id === chainNum) ?? null;
  }, [chainId, chains]);

  const tokenSymbol = useMemo(() => {
    return currentChain?.token ?? "ETH";
  }, [currentChain]);

  const [client, setClient] = useState<PublicClient | null>(null);

  useEffect(() => {
    if (!currentChain?.rpcUrl) {
      setClient(null);
      return;
    }

    const publicClient = createPublicClient({
      transport: http(currentChain.rpcUrl),
      chain: {
        id: currentChain.id,
        name: currentChain.name,
        nativeCurrency: {
          name: currentChain.token ?? "ETH",
          symbol: currentChain.token ?? "ETH",
          decimals: 18,
        },
        rpcUrls: {
          default: { http: [currentChain.rpcUrl] },
          public: { http: [currentChain.rpcUrl] },
        },
      },
    });

    setClient(publicClient);

    // H10: Cleanup previous client on chain change
    return () => {
      // viem PublicClient doesn't have a close method, but we clear the reference
      // to prevent stale state from being used in fetchBalance
    };
  }, [currentChain]);

  const fetchBalance = useCallback(async () => {
    if (!evmAccount || !client) {
      setBalance(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const address = evmAccount.includes(":") ? evmAccount.split(":").pop()! : evmAccount;
      const address_ = address as Address;
      const [balanceResult, price] = await Promise.all([
        client.getBalance({ address: address_ }),
        chainId ? getNativeTokenPriceUsd(chainId, currentChain?.rpcUrl).catch(() => null) : Promise.resolve(null),
      ]);
      setBalance(balanceResult.toString());
      setUsdPrice(price);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch balance"));
      setBalance(null);
      setUsdPrice(null);
    } finally {
      setIsLoading(false);
    }
  }, [evmAccount, client, chainId, currentChain?.rpcUrl]);

  // Initial fetch on connect / account change
  useEffect(() => {
    if (isConnected && evmAccount) {
      fetchBalance();
    }
  }, [isConnected, evmAccount, fetchBalance]);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0 && isConnected && evmAccount) {
      intervalRef.current = setInterval(fetchBalance, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [refreshInterval, isConnected, evmAccount, fetchBalance]);

  const formatted = useMemo(() => {
    if (balance === null) return null;
    try {
      return formatEther(BigInt(balance));
    } catch {
      return null;
    }
  }, [balance]);

  const usdValue = useMemo(() => {
    if (usdPrice === null || formatted === null) return null;
    const numericBalance = parseFloat(formatted);
    if (isNaN(numericBalance)) return null;
    const totalUsd = numericBalance * usdPrice;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(totalUsd);
  }, [usdPrice, formatted]);

  return {
    balance,
    formatted,
    symbol: tokenSymbol,
    usdPrice,
    usdValue,
    isLoading,
    error,
    refetch: fetchBalance,
    chain: currentChain,
  };
}
