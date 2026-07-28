import { useState, useCallback } from "react";
import { useWeb3 } from "../provider/Web3ConnectProvider";
import { getClient } from "../client";
import { WalletError } from "@naculus/connect-core";
import type { EvmTransaction } from "../types";

export type SendTransactionStatus = "idle" | "awaiting_approval" | "confirmed" | "failed";

export function useSendTransaction() {
  const { session, chainId } = useWeb3();
  const [status, setStatus] = useState<SendTransactionStatus>("idle");
  const [error, setError] = useState<Error | null>(null);

  const sendTransaction = useCallback(
    async (transaction: EvmTransaction): Promise<string> => {
      if (!session) {
        setStatus("failed");
        const err = new WalletError("wallet_unavailable", "No active session");
        setError(err);
        throw err;
      }

      const client = getClient();
      if (!client) {
        setStatus("failed");
        const err = new WalletError("wallet_unavailable", "Client not initialized");
        setError(err);
        throw err;
      }

      const evmAccount = Object.values(session.namespaces)
        .flatMap((ns) => ns.accounts)
        .find((acc) => acc.includes("0x"));

      if (!evmAccount) {
        setStatus("failed");
        const err = new WalletError("wallet_unavailable", "No EVM account found");
        setError(err);
        throw err;
      }

      setStatus("awaiting_approval");
      setError(null);

      try {
        const txWithFrom = {
          ...transaction,
          from: transaction.from ?? evmAccount.split(":").pop()
        };

        const result = (await client.sendTransaction(session, {
          transaction: txWithFrom,
          chainId: chainId ?? undefined
        })) as string;

        setStatus("confirmed");
        return result;
      } catch (err) {
        setStatus("failed");
        const errorMessage = err instanceof Error ? err.message : "Transaction failed";
        setError(err instanceof Error ? err : new Error(errorMessage));
        throw err;
      }
    },
    [session, chainId]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  return {
    sendTransaction,
    status,
    error,
    reset,
    isSending: status === "awaiting_approval"
  };
}
