import { chainNumber } from "@naculus/connect-appkit-core";
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

  // Null for anything that is not EIP-155. viem speaks to EVM nodes, and a
  // client built with a stand-in number would address a real chain that is
  // not the one connected.
  const evmChainNumber = currentChain ? chainNumber(currentChain) : null;

  const publicClient = useMemo<PublicClient | null>(() => {
    if (!currentChain?.rpcUrl || evmChainNumber === null) return null;

    return createPublicClient({
      transport: http(currentChain.rpcUrl),
      chain: {
        id: evmChainNumber,
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
  }, [currentChain, evmChainNumber]);

  const walletClient = useMemo<WalletClient | null>(() => {
    if (
      !isConnected ||
      !evmAccount ||
      !currentChain?.rpcUrl ||
      evmChainNumber === null
    )
      return null;

    const address = evmAccount.includes(":") ? evmAccount.split(":").pop()! : evmAccount;

    return createWalletClient({
      transport: http(currentChain.rpcUrl),
      chain: {
        id: evmChainNumber,
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
  }, [isConnected, evmAccount, currentChain, evmChainNumber]);

  return {
    publicClient,
    walletClient,
    chains
  };
}