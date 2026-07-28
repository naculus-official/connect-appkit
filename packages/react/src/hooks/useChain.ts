import { useMemo } from "react";
import { useWeb3 } from "../provider/Web3ConnectProvider";
import { getChainById } from "../utils/chains";
import type { WalletChain, ChainInfo } from "../types";

export function useChain() {
  const { chainId, session, switchChain, chains } = useWeb3();

  const currentChain = useMemo(() => {
    if (!chainId) return null;
    return getChainById(chains, chainId) ?? null;
  }, [chainId, chains]);

  const chainInfo = useMemo<ChainInfo | null>(() => {
    if (!chainId || !session) return null;

    const namespace = chainId.startsWith("eip155:")
      ? "eip155"
      : null;

    if (!namespace) return null;

    const chainNum = chainId.includes(":")
      ? parseInt(chainId.split(":")[1], 10)
      : parseInt(chainId, 10);

    const chain = chains.find((c) => c.namespace === namespace && c.id === chainNum);

    return {
      namespace,
      chainId,
      name: chain?.name ?? `Chain ${chainNum}`,
      selected: true
    };
  }, [chainId, session, chains]);

  const availableChains = useMemo<WalletChain[]>(() => {
    // Return all default EVM chains so users can see and switch to any supported chain
    // The session namespace only contains the current/approved chain, but we want to
    // make all configured chains available for switching.
    return chains;
  }, [chains]);

  return {
    chainId,
    currentChain,
    chainInfo,
    availableChains,
    chains: availableChains,
    isEvm: chainId?.startsWith("eip155:"),
    switchChain
  };
}
