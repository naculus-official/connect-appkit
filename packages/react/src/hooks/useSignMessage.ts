import { useState, useCallback } from "react";
import { useWeb3 } from "../provider/Web3ConnectProvider";
import { getClient } from "../client";
import { WalletError } from "@naculus/connect-core";

export function useSignMessage() {
  const { session, chainId } = useWeb3();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const signMessage = useCallback(
    async (message: string): Promise<string> => {
      // Precondition checks — set error state before throwing (consistent with useSendTransaction pattern)
      if (!session) {
        const err = new WalletError("wallet_unavailable", "No active session");
        setError(err);
        throw err;
      }

      const client = getClient();
      if (!client) {
        const err = new WalletError("wallet_unavailable", "Client not initialized");
        setError(err);
        throw err;
      }

      const address = Object.values(session.namespaces)
        .flatMap((ns) => ns.accounts)
        .find((acc) => acc.includes("0x")) ?? Object.values(session.namespaces)[0]?.accounts[0];

      if (!address) {
        const err = new WalletError("wallet_unavailable", "No account found");
        setError(err);
        throw err;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = (await client.signMessage(session, {
          message,
          address,
          chainId: chainId ?? undefined
        })) as string;

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Signing failed";
        const error = err instanceof Error ? err : new Error(errorMessage);
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [session, chainId]
  );

  return {
    signMessage,
    isSigning: isLoading,
    error
  };
}
