/**
 * useSIWxLogin — Trigger a SIWx sign-in flow.
 *
 * A simplified hook for initiating wallet sign-in.
 * Returns a `signIn()` function and loading/error state.
 */

import { useState, useCallback } from "react";
import { useWeb3 } from "../provider/Web3ConnectProvider";
import { getClient } from "../client";
import { WalletError } from "@naculus/connect-core";
import {
  createSiwxMessage,
  generateNonce,
  nowISO,
  getBlockchainName,
  type SiwxResult,
  type SiwxMessage,
} from "@naculus/siwx";

// ── Types ────────────────────────────────────────────────────────

export interface UseSIWxLoginOptions {
  /** Originating domain (default: window.location.host) */
  domain?: string;
  /** Human-readable statement */
  statement?: string;
  /** RFC 3986 URI (default: window.location.origin) */
  uri?: string;
  /** CAIP-2 chain ID (default: current chain from Web3 context) */
  chainId?: string;
  /** Session lifetime in seconds (default: 86400 = 24h) */
  expirySeconds?: number;
  /** URIs of resources the identity wishes to access */
  resources?: string[];
  /** CAIP-74 request ID */
  requestId?: string;
}

export interface UseSIWxLoginReturn {
  /** Trigger the SIWx sign-in flow */
  signIn: (options?: UseSIWxLoginOptions) => Promise<SiwxResult>;
  /** Whether a sign-in is in progress */
  isSigningIn: boolean;
  /** Last sign-in error */
  error: Error | null;
  /** Clear the last error */
  clearError: () => void;
}

// ── Defaults ─────────────────────────────────────────────────────

const DEFAULT_EXPIRY_SECONDS = 86_400; // 24h

function getDefaultDomain(): string {
  if (typeof window !== "undefined") return window.location.host;
  return "localhost";
}

function getDefaultUri(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost";
}

// ── Hook ─────────────────────────────────────────────────────────

export function useSIWxLogin(): UseSIWxLoginReturn {
  const { session, chainId: currentChainId } = useWeb3();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const signIn = useCallback(
    async (options?: UseSIWxLoginOptions): Promise<SiwxResult> => {
      if (!session) {
        throw new WalletError("wallet_unavailable", "No active session");
      }

      const client = getClient();
      if (!client) {
        throw new WalletError("wallet_unavailable", "Client not initialized");
      }

      // Resolve the first available account and chain
      const allAccounts = Object.entries(session.namespaces).flatMap(
        ([ns, info]) =>
          info.accounts.map((acc: string) => ({ ns, acc }))
      );

      if (allAccounts.length === 0) {
        throw new WalletError("wallet_unavailable", "No account found");
      }

      const { acc: address } = allAccounts[0];
      const chainId = options?.chainId ?? currentChainId ?? "eip155:1";
      const domain = options?.domain ?? getDefaultDomain();
      const uri = options?.uri ?? getDefaultUri();
      const nonce = generateNonce();
      const issuedAt = nowISO();
      const expirySeconds = options?.expirySeconds ?? DEFAULT_EXPIRY_SECONDS;
      const expirationTime = new Date(Date.now() + expirySeconds * 1000).toISOString();

      // Build the CAIP-122 message string
      const message = createSiwxMessage({
        domain,
        address,
        uri,
        version: 1,
        chainId,
        nonce,
        issuedAt,
        expirationTime,
        statement: options?.statement,
        resources: options?.resources,
        requestId: options?.requestId,
      });

      setIsSigningIn(true);
      setError(null);

      try {
        const signature = (await client.signMessage(session, {
          message,
          address,
          chainId: chainId ?? undefined,
        })) as string;

        const siwxResult: SiwxResult = {
          message: {
            raw: message,
            domain,
            address,
            statement: options?.statement ?? null,
            uri,
            version: 1,
            chainId,
            nonce,
            issuedAt,
            blockchain: getBlockchainName(chainId),
            expirationTime,
            notBefore: null,
            resources: options?.resources ?? [],
            requestId: options?.requestId ?? null,
          },
          signature,
        };

        setIsSigningIn(false);
        return siwxResult;
      } catch (err) {
        const wrappedErr =
          err instanceof Error ? err : new Error("SIWx sign-in failed");
        setError(wrappedErr);
        setIsSigningIn(false);
        throw wrappedErr;
      }
    },
    [session, currentChainId]
  );

  return { signIn, isSigningIn, error, clearError };
}
