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
} from "@naculus/siwx";

export interface UseSignInWithXOptions {
  domain?: string;
  statement?: string;
  uri?: string;
  chainId?: string;
  expirySeconds?: number;
  resources?: string[];
  requestId?: string;
}

export interface UseSignInWithXReturn {
  signIn: (options?: UseSignInWithXOptions) => Promise<SiwxResult>;
  isSigningIn: boolean;
  result: SiwxResult | null;
  error: Error | null;
  clearError: () => void;
}

function getDefaultDomain(): string {
  if (typeof window !== "undefined") return window.location.host;
  return "localhost";
}

function getDefaultUri(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost";
}

export function useSignInWithX(): UseSignInWithXReturn {
  const { session, chainId: currentChainId } = useWeb3();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [result, setResult] = useState<SiwxResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const signIn = useCallback(
    async (options?: UseSignInWithXOptions): Promise<SiwxResult> => {
      if (!session) {
        throw new WalletError("wallet_unavailable", "No active session");
      }

      const client = getClient();
      if (!client) {
        throw new WalletError("wallet_unavailable", "Client not initialized");
      }

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

      const message = createSiwxMessage({
        domain,
        address,
        uri,
        version: 1,
        chainId,
        nonce,
        issuedAt,
        statement: options?.statement,
        expirationTime: options?.expirySeconds
          ? new Date(Date.now() + options.expirySeconds * 1000).toISOString()
          : undefined,
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

        const expirationTime = options?.expirySeconds
          ? new Date(Date.now() + options.expirySeconds * 1000).toISOString()
          : null;

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

        setResult(siwxResult);
        return siwxResult;
      } catch (err) {
        const wrappedErr =
          err instanceof Error ? err : new Error("SIWx sign-in failed");
        setError(wrappedErr);
        throw wrappedErr;
      } finally {
        setIsSigningIn(false);
      }
    },
    [session, currentChainId]
  );

  return { signIn, isSigningIn, result, error, clearError };
}
