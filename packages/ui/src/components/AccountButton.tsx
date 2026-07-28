"use client";

import React from "react";
import { Wallet } from "lucide-react";
import { cn } from "../lib/cn";
import { useComponentRegistry } from "../contexts/ComponentRegistry";

export interface AccountButtonProps {
  className?: string;
  showAddress?: boolean;
  showBalance?: boolean;
  address?: string;
  balance?: string | null;
  balanceSymbol?: string;
  onConnect?: () => void;
}

function DefaultAvatar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
      {children}
    </div>
  );
}

export function AccountButton({
  className,
  showAddress = true,
  showBalance = false,
  address: externalAddress,
  balance: externalBalance,
  balanceSymbol,
  onConnect,
}: AccountButtonProps) {
  const registry = useComponentRegistry();
  const Button = registry.Button as React.ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }>;

  if (!externalAddress) {
    return (
      <Button
        aria-label="Connect Wallet"
        onClick={onConnect}
        className={className}
      >
        <Wallet size={18} className="shrink-0" />
        Connect Wallet
      </Button>
    );
  }

  const address = externalAddress.includes(":")
    ? externalAddress.split(":").pop()!
    : externalAddress;

  const shortAddress = address.slice(0, 6) + "..." + address.slice(-4);

  const formattedBalance = externalBalance !== null && externalBalance !== undefined
    ? parseFloat(externalBalance).toLocaleString(undefined, { maximumFractionDigits: 4 }) + " " + (balanceSymbol ?? "ETH")
    : null;

  return (
    <Button className={className}>
      <DefaultAvatar>W</DefaultAvatar>
      <div className="flex flex-col items-start gap-0">
        {showAddress && (
          <span className="font-mono text-xs">{shortAddress}</span>
        )}
        {showBalance && formattedBalance && (
          <span className="text-xs text-muted-foreground">{formattedBalance}</span>
        )}
        {showBalance && !formattedBalance && externalBalance === null && (
          <span className="text-xs text-muted-foreground">Loading...</span>
        )}
      </div>
    </Button>
  );
}
