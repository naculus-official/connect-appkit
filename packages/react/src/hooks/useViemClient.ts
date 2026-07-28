import { useMemo } from "react";
import { createPublicClient, http, createWalletClient, type PublicClient, type WalletClient } from "viem";
import type { WalletChain } from "../types";
import { useAccount } from "./useAccount";
import { useChain } from "./useChain";

export function useViemClient(): {
  publicClient: PublicClient | null;
  walletClient: WalletClient | null;
  chains: WalletChain[];
} {
  const { evmAccount, isConnected } = useAccount();
  const { currentChain, chains } = useChain();

  const publicClient = useMemo<PublicClient | null>(() => {
    if (!currentChain?.rpcUrl) return null;

    return createPublicClient({
      transport: http(currentChain.rpcUrl),
      chain: {
        id: currentChain.id,
        name: currentChain.name,
        nativeCurrency: {
          name: currentChain.token ?? "ETH",
          symbol: currentChain.token ?? "ETH",
          decimals: 18
        },
        rpcUrls: {
          default: { http: [currentChain.rpcUrl] },
          public: { http: [currentChain.rpcUrl] }
        }
      }
    });
  }, [currentChain]);

  const walletClient = useMemo<WalletClient | null>(() => {
    if (!isConnected || !evmAccount || !currentChain?.rpcUrl) return null;

    const address = evmAccount.includes(":") ? evmAccount.split(":").pop()! : evmAccount;

    return createWalletClient({
      transport: http(currentChain.rpcUrl),
      chain: {
        id: currentChain.id,
        name: currentChain.name,
        nativeCurrency: {
          name: currentChain.token ?? "ETH",
          symbol: currentChain.token ?? "ETH",
          decimals: 18
        },
        rpcUrls: {
          default: { http: [currentChain.rpcUrl] },
          public: { http: [currentChain.rpcUrl] }
        }
      },
      account: address as `0x${string}`
    });
  }, [isConnected, evmAccount, currentChain]);

  return {
    publicClient,
    walletClient,
    chains
  };
}