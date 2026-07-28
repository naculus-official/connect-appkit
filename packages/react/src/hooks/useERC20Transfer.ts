import { useState, useCallback, useRef } from "react";
import { useWeb3 } from "../provider/Web3ConnectProvider";
import { useAccount } from "./useAccount";
import { useViemClient } from "./useViemClient";
import { useSendTransaction } from "./useSendTransaction";
import { getClient } from "../client";
import { WalletError, ERC20_MIN_ABI, parseUnits } from "@naculus/connect-core";
import type { TokenConfig } from "@naculus/connect-core";
import type { Address, Hex } from "viem";
import { encodeFunctionData } from "viem";

// ── Helpers ───────────────────────────────────────────────────────

function toBareAddress(addr: string): Address {
  return (addr.includes(":") ? addr.split(":").pop()! : addr) as Address;
}

function encodeTransferCalldata(to: Address, amount: bigint): Hex {
  return encodeFunctionData({
    abi: ERC20_MIN_ABI,
    functionName: "transfer",
    args: [to, amount],
  });
}

// ── Types ─────────────────────────────────────────────────────────

export interface UseERC20TransferOptions {
  token: TokenConfig;
}

export interface UseERC20TransferReturn {
  /** Send a transfer. Returns tx hash on success. */
  sendTransfer: (to: Address, amount: string) => Promise<`0x${string}`>;
  isSending: boolean;
  error: Error | null;
}

// ── Hook ──────────────────────────────────────────────────────────

export function useERC20Transfer(
  options: UseERC20TransferOptions,
): UseERC20TransferReturn {
  const { publicClient, walletClient } = useViemClient();
  const { evmAccount, isConnected } = useAccount();
  const { session } = useWeb3();
  const { sendTransaction, isSending, error: sendTxError, reset } = useSendTransaction();
  const [localError, setLocalError] = useState<Error | null>(null);

  const decimalsRef = useRef<number | undefined>(options.token.decimals);
  const error = localError ?? sendTxError;

  const sendTransfer = useCallback(
    async (to: Address, amount: string): Promise<`0x${string}`> => {
      setLocalError(null);
      reset();

      if (!isConnected || !evmAccount) {
        const err = new WalletError("wallet_unavailable", "No connected account");
        setLocalError(err);
        throw err;
      }

      if (!publicClient) {
        const err = new WalletError("wallet_unavailable", "No public client available");
        setLocalError(err);
        throw err;
      }

      const address = toBareAddress(evmAccount);

      // Fetch decimals if not cached
      let decimals = decimalsRef.current;
      if (decimals === undefined) {
        decimals = await publicClient.readContract({
          address: options.token.address,
          abi: ERC20_MIN_ABI,
          functionName: "decimals",
        }) as number;
        decimalsRef.current = decimals;
      }

      const rawAmount = parseUnits(amount, decimals);
      const data = encodeTransferCalldata(to, rawAmount);

      try {
        // Strategy 1: session-based connector
        if (session) {
          const client = getClient();
          if (client) {
            const txHash = await sendTransaction({
              to: options.token.address,
              data,
              value: "0",
            });
            return txHash as `0x${string}`;
          }
        }

        // Strategy 2: embedded wallet via viem wallet client
        if (walletClient) {
          const { request } = await publicClient.simulateContract({
            address: options.token.address,
            abi: ERC20_MIN_ABI,
            functionName: "transfer",
            args: [to, rawAmount],
            account: address,
          });
          const txHash = await walletClient.writeContract(request);
          return txHash;
        }

        // Strategy 3: fallback to sendTransaction hook
        const txHash = await sendTransaction({
          to: options.token.address,
          data,
          value: "0",
        });
        return txHash as `0x${string}`;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Transfer failed");
        setLocalError(error);
        throw error;
      }
    },
    [options.token, publicClient, walletClient, evmAccount, isConnected, session, sendTransaction, reset],
  );

  return {
    sendTransfer,
    isSending,
    error,
  };
}
