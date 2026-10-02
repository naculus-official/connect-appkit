import {
  type Authorization,
  evaluateSpend,
  type ListedAuthorization,
  type SpendRefusal,
  type SpendRequest,
} from "@naculus/connect-core";

export type AssetId = string;

export interface AuthorizationAssetMetadata {
  symbol: string;
  decimals: number;
}

export interface DescribeAuthorizationOptions {
  assets?: Record<AssetId, AuthorizationAssetMetadata>;
  /** Unix timestamp in seconds. */
  now?: number;
}

export interface AuthorizationRecipientView {
  shortened: string;
  full: string;
}

export interface AuthorizationAmountView {
  formatted: string;
}

export interface AuthorizationGrantView {
  asset: AssetId;
  assetLabel: string;
  recipients: AuthorizationRecipientView[];
  perPayment: AuthorizationAmountView;
  total: AuthorizationAmountView;
  count: number | null;
  rails: string[];
}

export interface AuthorizationExpiryView {
  timestamp: number;
  absolute: string;
  relative: string;
}

export interface AuthorizationDescription {
  label: string | null;
  principal: string | null;
  grants: AuthorizationGrantView[];
  expiry: AuthorizationExpiryView;
  warnings: string[];
}

function assetAddress(asset: string): string {
  const separator = asset.indexOf("/");
  const reference = separator === -1 ? asset : asset.slice(separator + 1);
  const colon = reference.indexOf(":");
  return colon === -1 ? reference : reference.slice(colon + 1);
}

function shorten(value: string): string {
  return value.length <= 14 ? value : `${value.slice(0, 6)}…${value.slice(-6)}`;
}

function formatAmount(
  amount: bigint,
  metadata: AuthorizationAssetMetadata | undefined,
): AuthorizationAmountView {
  const baseUnits = amount.toString();
  if (!metadata) {
    return { formatted: `${baseUnits} base units` };
  }
  if (
    metadata.symbol === "" ||
    !Number.isSafeInteger(metadata.decimals) ||
    metadata.decimals < 0
  ) {
    return { formatted: `${baseUnits} base units` };
  }
  const decimals = metadata.decimals;
  const padded = baseUnits.padStart(decimals + 1, "0");
  const integer = decimals === 0 ? padded : padded.slice(0, -decimals);
  const fraction =
    decimals === 0 ? "" : padded.slice(-decimals).replace(/0+$/, "");
  const value = `${integer}${fraction ? `.${fraction}` : ""}`;
  return { formatted: `${value} ${metadata.symbol}` };
}

function relativeExpiry(expiresAt: number, now: number): string {
  return new Intl.RelativeTimeFormat("en").format(expiresAt - now, "second");
}

/** Build a network-free consent/listing view of an authorization. */
export function describeAuthorization(
  input: Authorization | ListedAuthorization,
  options: DescribeAuthorizationOptions = {},
): AuthorizationDescription {
  const now = options.now ?? Math.floor(Date.now() / 1_000);
  const flags = "flags" in input ? input.flags : [];
  const label = "label" in input ? (input.label ?? null) : null;
  return {
    label,
    principal: input.principal ?? null,
    grants: input.grants.map((grant) => {
      const metadata = options.assets?.[grant.asset];
      return {
        asset: grant.asset,
        assetLabel: metadata?.symbol || assetAddress(grant.asset),
        recipients: grant.recipients.map((full) => ({
          shortened: shorten(full),
          full,
        })),
        perPayment: formatAmount(grant.maxPerPayment, metadata),
        total: formatAmount(grant.maxTotal, metadata),
        count: grant.maxCount ?? null,
        rails: grant.rails.map((rail) => rail.replaceAll("-", " ")),
      };
    }),
    expiry: {
      timestamp: input.expiresAt,
      absolute: new Date(input.expiresAt * 1_000).toISOString(),
      relative: relativeExpiry(input.expiresAt, now),
    },
    warnings: flags.map((flag) =>
      flag === "unrestricted-recipient-legacy"
        ? "Strong warning: key can pay any recipient"
        : "this key can do more than shown",
    ),
  };
}

const REFUSAL_SENTENCES: Record<SpendRefusal, string> = {
  expired: "This authorization has expired.",
  "not-yet-valid": "This authorization is not valid yet.",
  "no-matching-grant": "No grant covers this asset.",
  "recipient-not-allowed": "This recipient is not allowed.",
  "over-per-payment": "This amount exceeds the per-payment limit.",
  "over-total": "This amount exceeds the remaining total limit.",
  "over-count": "This authorization has reached its payment count limit.",
  "rail-not-allowed": "This payment rail is not allowed.",
  "invalid-authorization": "The authorization or spend request is invalid.",
};

export type SpendExplanation =
  | {
      allowed: true;
      grant: number;
      remainingTotal: bigint;
      remainingTotalFormatted: AuthorizationAmountView;
      sentence: string;
    }
  | { allowed: false; reason: SpendRefusal; sentence: string };

/** Explain the shared evaluator's exact allow/refuse result for a UI. */
export function explainSpend(
  authorization: Authorization,
  request: SpendRequest,
  options: DescribeAuthorizationOptions = {},
): SpendExplanation {
  const verdict = evaluateSpend(authorization, request);
  if (!verdict.allow) {
    return {
      allowed: false,
      reason: verdict.reason,
      sentence: REFUSAL_SENTENCES[verdict.reason],
    };
  }
  const remainingTotal =
    authorization.grants[verdict.grant].maxTotal -
    request.spentSoFar -
    request.amount;
  return {
    allowed: true,
    grant: verdict.grant,
    remainingTotal,
    remainingTotalFormatted: formatAmount(
      remainingTotal,
      options.assets?.[authorization.grants[verdict.grant].asset],
    ),
    sentence: `Allowed by grant ${verdict.grant + 1}; ${remainingTotal.toString()} base units remain.`,
  };
}
