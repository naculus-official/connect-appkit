import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useWeb3 } from "../provider/Web3ConnectProvider";
import { useAccount } from "./useAccount";
import {
  createPublicClient,
  http,
  formatUnits,
  type PublicClient,
  type Address,
} from "viem";

export interface TokenInfo {
  /** ERC-20 token contract address */
  address: Address;
  /** Token symbol (e.g. "USDC", "LINK") */
  symbol: string;
  /** Token decimals (e.g. 6 for USDC, 18 for most) */
  decimals: number;
  /** Optional display name */
  name?: string;
}

export interface UseTokenBalanceOptions {
  /** ERC-20 token(s) to query */
  tokens: TokenInfo[];
  /** Auto-refresh interval in milliseconds. Default: undefined (no auto-refresh). */
  refreshInterval?: number;
}

export interface TokenBalanceResult {
  address: Address;
  symbol: string;
  decimals: number;
  name?: string;
  /** Raw balance as string (in smallest unit), or null if not loaded */
  balance: string | null;
  /** Human-readable formatted balance, or null if not loaded */
  formatted: string | null;
}

export function useTokenBalance(options: UseTokenBalanceOptions) {
  const { evmAccount, isConnected } = useAccount();
  const { chainId, chains } = useWeb3();
  const [tokenBalances, setTokenBalances] = useState<TokenBalanceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { tokens, refreshInterval } = options;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Stable key for tokens to avoid infinite loops when array reference changes
  const tokensKey = useMemo(
    () => tokens.map(t => t.address.toLowerCase() + "|" + t.decimals + "|" + t.symbol).join(","),
    [tokens]
  );

  const currentChain = useMemo(() => {
    if (!chainId || !chains.length) return null;
    const namespace = chainId.startsWith("eip155:") ? "eip155" : null;
    if (!namespace) return null;
    const chainNum = parseInt(chainId.split(":")[1], 10);
    return chains.find((c) => c.namespace === namespace && c.id === chainNum) ?? null;
  }, [chainId, chains]);

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
  }, [currentChain]);

  // ERC-20 ABI fragment for balanceOf
  const erc20Abi = [
    {
      name: "balanceOf",
      type: "function",
      stateMutability: "view",
      inputs: [{ name: "owner", type: "address" }],
      outputs: [{ name: "balance", type: "uint256" }],
    },
  ] as const;

  const fetchTokenBalances = useCallback(async () => {
    if (!evmAccount || !client || tokens.length === 0) {
      setTokenBalances([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const address = evmAccount.includes(":")
        ? (evmAccount.split(":").pop() as Address)
        : (evmAccount as Address);

      // Query all token balances with individual error handling
      const results = await Promise.allSettled(
        tokens.map(async (token) => {
          try {
            const balance = await client.readContract({
              address: token.address,
              abi: erc20Abi,
              functionName: "balanceOf",
              args: [address],
            });
            return {
              address: token.address,
              symbol: token.symbol,
              decimals: token.decimals,
              name: token.name,
              balance: balance.toString(),
              formatted: formatUnits(balance, token.decimals),
            } as TokenBalanceResult;
          } catch {
            return {
              address: token.address,
              symbol: token.symbol,
              decimals: token.decimals,
              name: token.name,
              balance: null,
              formatted: null,
            } as TokenBalanceResult;
          }
        })
      );

      const balances: TokenBalanceResult[] = results.map((r) => {
        if (r.status === "fulfilled") {
          return r.value;
        }
        // Fallback for rejected promises (shouldn't happen with inner catch)
        return {
          address: "" as Address,
          symbol: "?",
          decimals: 0,
          balance: null,
          formatted: null,
        };
      });

      setTokenBalances(balances);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch token balances"));
    } finally {
      setIsLoading(false);
    }
  }, [evmAccount, client, tokensKey]);

  // Initial fetch
  useEffect(() => {
    if (isConnected && evmAccount && tokens.length > 0) {
      fetchTokenBalances();
    }
  }, [isConnected, evmAccount, tokensKey, fetchTokenBalances]);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0 && isConnected && evmAccount && tokens.length > 0) {
      intervalRef.current = setInterval(fetchTokenBalances, refreshInterval);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [refreshInterval, isConnected, evmAccount, tokensKey, fetchTokenBalances]);

  // Helper: get a single token balance by address
  const getTokenBalance = useCallback(
    (tokenAddress: Address): TokenBalanceResult | undefined => {
      return tokenBalances.find(
        (tb) => tb.address.toLowerCase() === tokenAddress.toLowerCase()
      );
    },
    [tokenBalances]
  );

  return {
    /** Array of token balance results */
    tokenBalances,
    isLoading,
    error,
    /** Re-fetch all token balances */
    refetch: fetchTokenBalances,
    /** Get a specific token balance by contract address */
    getTokenBalance,
    chain: currentChain,
  };
}
