import { useState, useCallback } from "react";
import { useWeb3 } from "../provider/Web3ConnectProvider";
import { WalletError } from "@naculus/connect-core";
import type { EvmTransaction } from "../types";
import { resolveClient } from "./client-resolver";

export type SendTransactionStatus = "idle" | "awaiting_approval" | "confirmed" | "failed";

export function useSendTransaction() {
  const { session, chainId, client } = useWeb3();
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

      const evmAccount = session.namespaces.eip155?.accounts.find((account) =>
        /^eip155:\d+:0x[0-9a-fA-F]{40}$/.test(account) || /^0x[0-9a-fA-F]{40}$/.test(account),
      );

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

        const activeClient = resolveClient(client);
        if (!activeClient) {
          throw new WalletError("wallet_unavailable", "Client not initialized");
        }
        const result = (await activeClient.sendTransaction(session, {
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
    [session, chainId, client]
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
