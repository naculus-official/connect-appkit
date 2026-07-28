import type { WalletChain } from "../types";
import { CHAINS, getRpcUrl, DEFAULT_RPC_URLS } from "@naculus/connect-core";

// ─── Static Overrides ──────────────────────────────────────────────
// Chains that exist in the old default list but are NOT in chain-registry.
// These are deprecated testnets; keep for backward compatibility.

const STATIC_TESTNETS: WalletChain[] = [
  {
    id: 5,
    namespace: "eip155",
    name: "Goerli",
    rpcUrl: "https://goerli.blockpi.network/v1/rpc/public",
    explorerUrl: "https://goerli.etherscan.io",
    token: "ETH",
  },
  {
    id: 80001,
    namespace: "eip155",
    name: "Mumbai",
    rpcUrl: "https://rpc-mumbai.maticvigil.com",
    explorerUrl: "https://mumbai.polygonscan.com",
    token: "MATIC",
  },
  {
    id: 421613,
    namespace: "eip155",
    name: "Arbitrum Goerli",
    rpcUrl: "https://goerli-rollup.arbitrum.io/rpc",
    explorerUrl: "https://goerli.arbiscan.io",
    token: "ETH",
  },
  {
    id: 420,
    namespace: "eip155",
    name: "Optimism Goerli",
    rpcUrl: "https://goerli.optimism.io",
    explorerUrl: "https://goerli-optimism.etherscan.io",
    token: "ETH",
  },
];

// ─── Build from Registry ───────────────────────────────────────────
// Derive WalletChain entries from the single-source-of-truth chain-registry
// and the RPC URL defaults from rpc.ts.

function toWalletChain(chainId: number): WalletChain | null {
  const info = CHAINS[chainId];
  if (!info) return null;

  // Only include chains with an explorer URL (meaningful for UI display)
  if (!info.explorerUrl) return null;

  const caip2Id = info.caip2Id;

  return {
    id: chainId,
    namespace: "eip155",
    name: info.name,
    rpcUrl: getRpcUrl(caip2Id, DEFAULT_RPC_URLS[caip2Id] ?? ""),
    explorerUrl: info.explorerUrl,
    token: info.nativeCurrency.symbol,
  };
}

function buildDefaultChains(): WalletChain[] {
  if (!CHAINS) return [];

  const registryChains: WalletChain[] = [];

  // Order by chain ID for deterministic output
  const chainIds = Object.keys(CHAINS)
    .map(Number)
    .sort((a, b) => a - b);

  for (const id of chainIds) {
    const chain = toWalletChain(id);
    if (chain) {
      registryChains.push(chain);
    }
  }

  // Append static testnets that aren't in the registry
  for (const testnet of STATIC_TESTNETS) {
    if (!CHAINS[testnet.id]) {
      registryChains.push(testnet);
    }
  }

  return registryChains;
}

export const DEFAULT_EVM_CHAINS: WalletChain[] = buildDefaultChains();

// ─── Helpers ───────────────────────────────────────────────────────

export function getChainById(chains: WalletChain[], chainId: string): WalletChain | undefined {
  return chains.find((chain) => {
    const chainNamespace = chainId.startsWith("eip155:")
      ? "eip155"
      : null;

    if (!chainNamespace) return false;

    const chainNum = chainId.includes(":")
      ? parseInt(chainId.split(":")[1], 10)
      : parseInt(chainId, 10);

    return chain.namespace === chainNamespace && chain.id === chainNum;
  });
}

export function getDefaultChains(): WalletChain[] {
  return [...DEFAULT_EVM_CHAINS];
}
