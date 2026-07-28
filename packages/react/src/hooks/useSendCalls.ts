import { useState, useCallback } from "react";
import { useWeb3 } from "../provider/Web3ConnectProvider";
import { getClient } from "../client";
import { WalletError } from "@naculus/connect-core";
import type { BatchCall, CallsStatus } from "@naculus/connect-core";

export type SendCallsStatus = "idle" | "awaiting_approval" | "confirmed" | "failed";

export function useSendCalls() {
  const { session, chainId } = useWeb3();
  const [status, setStatus] = useState<SendCallsStatus>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [batchHash, setBatchHash] = useState<string | null>(null);
  const [callsStatus, setCallsStatus] = useState<CallsStatus | null>(null);

  const sendCalls = useCallback(
    async (calls: BatchCall[], options?: { chainId?: string }): Promise<string> => {
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

      if (calls.length === 0) {
        setStatus("failed");
        const err = new WalletError("invalid_input", "At least one call is required");
        setError(err);
        throw err;
      }

      setStatus("awaiting_approval");
      setError(null);
      setBatchHash(null);

      try {
        const result = await client.sendCalls(
          session,
          calls,
          options?.chainId ?? chainId ?? undefined,
        );
        setStatus("confirmed");
        setBatchHash(result);
        return result;
      } catch (err) {
        setStatus("failed");
        const errorMessage = err instanceof Error ? err.message : "sendCalls failed";
        setError(err instanceof Error ? err : new Error(errorMessage));
        throw err;
      }
    },
    [session, chainId],
  );

  const getCallsStatus = useCallback(
    async (hash?: string): Promise<CallsStatus> => {
      if (!session) {
        throw new WalletError("wallet_unavailable", "No active session");
      }

      const client = getClient();
      if (!client) {
        throw new WalletError("wallet_unavailable", "Client not initialized");
      }

      const bundleHash = hash ?? batchHash;
      if (!bundleHash) {
        throw new WalletError("invalid_input", "No bundle hash available");
      }

      const result = await client.getCallsStatus(session, bundleHash);
      setCallsStatus(result);
      return result;
    },
    [session, batchHash],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setBatchHash(null);
    setCallsStatus(null);
  }, []);

  return {
    sendCalls,
    getCallsStatus,
    status,
    error,
    batchHash,
    callsStatus,
    reset,
    isSending: status === "awaiting_approval",
  };
}
