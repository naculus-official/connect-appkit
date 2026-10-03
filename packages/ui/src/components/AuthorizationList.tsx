"use client";

import type {
  ListedAuthorization,
  RevokeListedAuthorizationResult,
} from "@naculus/connect-core";
import {
  describeAuthorization,
  formatAuthorizationAmount,
  type AuthorizationAssetMetadata,
} from "@naculus/connect-appkit-core";
import { AlertTriangle, Ban } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useComponentRegistry } from "../contexts/ComponentRegistry";
import {
  NativeBadge,
  NativeButton,
  NativeCard,
  type RegistryButton,
} from "../lib/registry-fallbacks";
import { cn } from "../lib/cn";
import { Address } from "./payment-ui";

export interface AuthorizationListProps {
  entries: ListedAuthorization[] | { entries: ListedAuthorization[] };
  assets?: Record<string, AuthorizationAssetMetadata>;
  onRevoke: (
    entry: ListedAuthorization,
  ) =>
    | RevokeListedAuthorizationResult
    | Promise<RevokeListedAuthorizationResult>;
  revokingId?: string;
  locale?: string;
  className?: string;
}

export function AuthorizationList({
  entries: input,
  assets = {},
  onRevoke,
  revokingId,
  locale,
  className,
}: AuthorizationListProps) {
  const entries = Array.isArray(input) ? input : input.entries;
  const [confirming, setConfirming] = useState<string | null>(null);
  const [onChain, setOnChain] = useState<Set<string>>(new Set());
  const registry = useComponentRegistry();
  const Button =
    (registry.Button as RegistryButton | undefined) ?? NativeButton;
  const Card =
    (registry.Card as
      | React.ComponentType<React.HTMLAttributes<HTMLDivElement>>
      | undefined) ?? NativeCard;
  const Badge =
    (registry.Badge as
      | React.ComponentType<React.HTMLAttributes<HTMLSpanElement>>
      | undefined) ?? NativeBadge;

  if (entries.length === 0) {
    return (
      <section
        className={cn(
          "rounded-xl border border-dashed border-border p-8 text-center",
          className,
        )}
      >
        <Ban aria-hidden className="mx-auto mb-2 text-muted-foreground" />
        <h2 className="font-semibold">No payment authorizations</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Approvals you create will appear here.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="authorization-list-title"
      className={cn("flex flex-col gap-3", className)}
    >
      <h2 id="authorization-list-title" className="text-lg font-semibold">
        Payment authorizations
      </h2>
      {entries.map((entry) => {
        const view = describeAuthorization(entry, { assets, locale });
        const busy = revokingId === entry.keyId;
        return (
          <Card key={entry.keyId} className="min-w-0 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="break-all font-semibold">
                  {view.label ??
                    view.grants.map((grant) => grant.assetLabel).join(", ")}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {{
                    "evm-session": "EVM session key",
                    "solana-session": "Solana session key",
                    "mpp-voucher": "MPP channel key",
                  }[entry.enforcer] ?? entry.enforcer.replaceAll("-", " ")}
                </p>
              </div>
              <Badge
                className={cn(
                  "capitalize",
                  entry.status === "active" && "bg-primary text-primary-foreground",
                  entry.status === "pending" && "border border-border bg-background",
                  (entry.status === "revoked" || entry.status === "expired") &&
                    "bg-muted text-muted-foreground",
                )}
              >
                {entry.status}
              </Badge>
            </div>
            <div className="mt-3 flex flex-col gap-3">
              {view.grants.map((grant) => {
                const spent = entry.spent?.[grant.asset];
                const total = entry.grants.find(
                  (candidate) => candidate.asset === grant.asset,
                )?.maxTotal;
                const percent =
                  spent !== undefined && total && total > 0n
                    ? Number((spent * 100n) / total)
                    : null;
                return (
                  <div
                    key={grant.asset}
                    className="min-w-0 rounded-lg bg-muted p-3"
                  >
                    {view.label && (
                      <p className="break-all text-sm font-medium">
                        {grant.assetLabel}
                      </p>
                    )}
                    <div className="mt-1 flex flex-col gap-1">
                      {grant.recipients.map((recipient) => (
                        <Address key={recipient.full} value={recipient.full} />
                      ))}
                    </div>
                    {spent !== undefined && (
                      <div className="mt-3">
                        <div className="flex justify-between gap-2 text-xs">
                          <span>
                            Spent{" "}
                            {formatAuthorizationAmount(
                              spent,
                              assets[grant.asset],
                            ).formatted}
                          </span>
                          <span>Total {grant.total.formatted}</span>
                        </div>
                        <div
                          role="progressbar"
                          aria-label={`${grant.assetLabel} spent`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={Math.min(percent ?? 0, 100)}
                          className="mt-1 h-2 overflow-hidden rounded-full bg-background"
                        >
                          <span
                            className="block h-full bg-primary"
                            style={{ width: `${Math.min(percent ?? 0, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p
              className="mt-3 text-xs text-muted-foreground"
              title={new Date(view.expiry.timestamp * 1_000).toISOString()}
            >
              {entry.status === "expired"
                ? "Expired"
                : entry.status === "revoked"
                  ? "Revoked"
                  : `Expires ${view.expiry.relative}`} · {view.expiry.absolute}
            </p>
            {view.warnings.map((warning) => (
              <p
                role="alert"
                key={warning}
                className="mt-2 flex gap-2 rounded-md border border-amber-700 bg-amber-50 p-2 text-sm text-amber-950 dark:border-amber-500 dark:bg-amber-950 dark:text-amber-100"
              >
                <AlertTriangle aria-hidden className="shrink-0" size={16} />
                {warning}
              </p>
            ))}
            {onChain.has(entry.keyId) && (
              <p
                role="status"
                className="mt-2 rounded-md border border-amber-700 p-2 text-sm font-medium"
              >
                Local access is revoked. Complete the on-chain revocation to
                stop this authorization on chain.
              </p>
            )}
            {entry.status === "active" || entry.status === "pending" ? (
              <div className="mt-3 flex justify-end gap-2">
                {confirming === entry.keyId ? (
                  <>
                    <Button variant="ghost" onClick={() => setConfirming(null)}>
                      Cancel
                    </Button>
                    <Button
                      disabled={busy}
                      aria-busy={busy}
                      onClick={() =>
                        void Promise.resolve(onRevoke(entry)).then((result) => {
                          setConfirming(null);
                          if (result.onChainRevocationRequired)
                            setOnChain((current) =>
                              new Set(current).add(entry.keyId),
                            );
                        })
                      }
                    >
                      {busy ? "Revoking…" : "Confirm revoke"}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setConfirming(entry.keyId)}
                  >
                    Revoke
                  </Button>
                )}
              </div>
            ) : null}
          </Card>
        );
      })}
    </section>
  );
}
