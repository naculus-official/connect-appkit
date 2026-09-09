/**
 * Which chains a session can actually switch to, and what the current one is.
 *
 * Framework-neutral, and deliberately built on `parseChainId` from
 * `@naculus/connect-core` rather than on another `startsWith("eip155:")`.
 */

import { eip155Reference, namespaceOf } from "@naculus/connect-core";
import type { ChainInfo, WalletChain } from "../types";

/**
 * The configured chain matching a CAIP-2 id, or null.
 *
 * `WalletChain.id` is a number, which can only ever describe an EIP-155
 * chain — a Solana reference is base58 and an XRPL one is an unsigned
 * network id. So this matches EIP-155 chains and answers null for the rest,
 * which is the truth about what the registry can represent rather than a
 * guess dressed up as a match.
 */
export function resolveChain(
  chains: WalletChain[],
  chainId: string | null | undefined,
): WalletChain | null {
  if (!chainId) return null;
  const reference = eip155Reference(chainId);
  if (reference === null) return null;
  return (
    chains.find((c) => c.namespace === "eip155" && c.id === reference) ?? null
  );
}

/**
 * The chains worth offering for the session's namespace.
 *
 * This used to return every configured chain regardless of what was
 * connected, so a Solana wallet was offered Ethereum and Polygon in the
 * switcher. Clicking one asked a wallet that has no concept of EIP-155 to
 * switch to chain 137 — an action the interface presented as available and
 * that could never work.
 *
 * With no connected chain, everything is offered: nothing has been ruled out
 * yet, and hiding the list would leave a user unable to pick.
 */
export function chainsForNamespace(
  chains: WalletChain[],
  chainId: string | null | undefined,
): WalletChain[] {
  if (!chainId) return chains;
  const namespace = namespaceOf(chainId);
  if (!namespace) return chains;
  return chains.filter((c) => c.namespace === namespace);
}

/**
 * A description of the connected chain for display.
 *
 * Returns something for every namespace. It used to return null for anything
 * that was not EIP-155, so a connected Solana wallet had no chain to show at
 * all and the interface fell back to "Unknown Chain".
 */
export function describeChain(
  chains: WalletChain[],
  chainId: string | null | undefined,
): ChainInfo | null {
  if (!chainId) return null;
  const namespace = namespaceOf(chainId);
  if (!namespace) return null;

  const known = resolveChain(chains, chainId);
  if (known) {
    return { namespace, chainId, name: known.name, selected: true };
  }

  // No configured entry. Name it by its CAIP-2 reference rather than
  // inventing one: "Chain 5" for a Solana cluster would be a fabrication, and
  // the reference is at least something a user can look up.
  const reference = chainId.slice(namespace.length + 1);
  return {
    namespace,
    chainId,
    name: namespace === "eip155" ? `Chain ${reference}` : reference,
    selected: true,
  };
}
