import { useMemo } from "react";
import { useWeb3 } from "../provider/Web3ConnectProvider";

export function useAccount() {
  const { accounts, session, isConnected } = useWeb3();

  const accountData = useMemo(() => {
    if (!isConnected || accounts.length === 0) {
      return null;
    }

    return accounts.map((address) => {
      // H12: Strengthened CAIP-10 / address detection
      // Valid formats:
      //   CAIP-10: "eip155:1:0x1234...5678" (namespace:chainId:address)
      //   Plain:   "0x1234...5678" (42-char hex, 0x + 40 hex chars)
      const isCaip10 = /^eip155:\d+:0x[0-9a-fA-F]{40}$/.test(address);
      const isPlainHex = /^0x[0-9a-fA-F]{40}$/.test(address);
      const isEvm = isCaip10 || isPlainHex;

      return {
        address,
        isEVM: isEvm,
      };
    });
  }, [accounts, isConnected]);

  const evmAccount = accountData?.find((a) => a.isEVM)?.address ?? null;

  return {
    accounts: accountData,
    evmAccount,
    primaryAccount: accounts[0] ?? null,
    isConnected,
    count: accounts.length
  };
}
