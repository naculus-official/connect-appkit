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

function encodeApproveCalldata(spender: Address, amount: bigint): Hex {
  return encodeFunctionData({
    abi: ERC20_MIN_ABI,
    functionName: "approve",
    args: [spender, amount],
  });
}

// ── Constants ─────────────────────────────────────────────────────

const MAX_UINT256 = 2n ** 256n - 1n;

// ── Types ─────────────────────────────────────────────────────────

export interface UseERC20ApproveOptions {
  token: TokenConfig;
  spender: Address;
}

export interface UseERC20ApproveReturn {
  /** Approve a specific amount */
  approve: (amount: string) => Promise<`0x${string}`>;
  /** Approve max (type(uint256).max — infinite approval) */
  approveMax: () => Promise<`0x${string}`>;
  /** Current allowance as raw bigint */
  allowanceRaw: bigint | null;
  /** Current allowance as human-readable string */
  allowance: string | null;
  /** Check if allowance >= required amount */
  hasAllowance: (required: string) => Promise<boolean>;
  isApproving: boolean;
  isFetchingAllowance: boolean;
  error: Error | null;
  refetchAllowance: () => Promise<void>;
}

// ── Hook ──────────────────────────────────────────────────────────

export function useERC20Approve(
  options: UseERC20ApproveOptions,
): UseERC20ApproveReturn {
  const { publicClient, walletClient } = useViemClient();
  const { evmAccount, isConnected } = useAccount();
  const { session } = useWeb3();
  const { sendTransaction, isSending, error: sendTxError, reset } = useSendTransaction();
  const [localError, setLocalError] = useState<Error | null>(null);
  const [allowanceRaw, setAllowanceRaw] = useState<bigint | null>(null);
  const [isFetchingAllowance, setIsFetchingAllowance] = useState(false);

  const decimalsRef = useRef<number | undefined>(options.token.decimals);
  const error = localError ?? sendTxError;

  const ownerAddress = (() => {
    if (!evmAccount) return null;
    return toBareAddress(evmAccount);
  })();

  const fetchAllowance = useCallback(async () => {
    if (!publicClient || !ownerAddress) return;

    setIsFetchingAllowance(true);
    try {
      const raw = await publicClient.readContract({
        address: options.token.address,
        abi: ERC20_MIN_ABI,
        functionName: "allowance",
        args: [ownerAddress, options.spender],
      });
      setAllowanceRaw(raw as bigint);
    } catch {
      setAllowanceRaw(null);
    } finally {
      setIsFetchingAllowance(false);
    }
  }, [publicClient, ownerAddress, options.token.address, options.spender]);

  const allowance = (() => {
    if (allowanceRaw === null) return null;
    const decimals = decimalsRef.current ?? options.token.decimals ?? 18;
    const str = allowanceRaw.toString();
    const padded = str.padStart(decimals + 1, "0");
    const dotPos = padded.length - decimals;
    let intPart = padded.slice(0, dotPos).replace(/^0+/, "") || "0";
    let fracPart = padded.slice(dotPos).replace(/0+$/, "");
    return fracPart ? `${intPart}.${fracPart}` : intPart;
  })();

  const doApprove = useCallback(
    async (rawAmount: bigint): Promise<`0x${string}`> => {
      setLocalError(null);
      reset();

      if (!isConnected || !evmAccount) {
        const err = new WalletError("wallet_unavailable", "No connected account");
        setLocalError(err);
        throw err;
      }

      if (!publicClient) {
        const err = new WalletError("wallet_unavailable", "No public client");
        setLocalError(err);
        throw err;
      }

      const data = encodeApproveCalldata(options.spender, rawAmount);

      try {
        if (session) {
          const client = getClient();
          if (client) {
            const txHash = await sendTransaction({
              to: options.token.address,
              data,
              value: "0",
            });
            fetchAllowance();
            return txHash as `0x${string}`;
          }
        }

        if (walletClient) {
          const { request } = await publicClient.simulateContract({
            address: options.token.address,
            abi: ERC20_MIN_ABI,
            functionName: "approve",
            args: [options.spender, rawAmount],
            account: ownerAddress!,
          });
          const txHash = await walletClient.writeContract(request);
          fetchAllowance();
          return txHash;
        }

        const txHash = await sendTransaction({
          to: options.token.address,
          data,
          value: "0",
        });
        fetchAllowance();
        return txHash as `0x${string}`;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Approve failed");
        setLocalError(error);
        throw error;
      }
    },
    [options, publicClient, walletClient, evmAccount, isConnected, session, ownerAddress, sendTransaction, reset, fetchAllowance],
  );

  const approveAmount = useCallback(
    async (amount: string): Promise<`0x${string}`> => {
      if (!publicClient) throw new WalletError("wallet_unavailable", "No public client");

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
      return doApprove(rawAmount);
    },
    [options.token.address, publicClient, doApprove],
  );

  const approveMaxAmount = useCallback(async (): Promise<`0x${string}`> => {
    return doApprove(MAX_UINT256);
  }, [doApprove]);

  const checkAllowance = useCallback(
    async (required: string): Promise<boolean> => {
      if (allowanceRaw === null) {
        await fetchAllowance();
      }
      if (allowanceRaw === null) return false;

      let decimals = decimalsRef.current ?? options.token.decimals;
      if (decimals === undefined) {
        decimals = 18; // safe fallback
      }

      const requiredRaw = parseUnits(required, decimals);
      return allowanceRaw >= requiredRaw;
    },
    [allowanceRaw, fetchAllowance, options.token.decimals],
  );

  return {
    approve: approveAmount,
    approveMax: approveMaxAmount,
    allowance,
    allowanceRaw,
    hasAllowance: checkAllowance,
    isApproving: isSending,
    isFetchingAllowance,
    error,
    refetchAllowance: fetchAllowance,
  };
}
