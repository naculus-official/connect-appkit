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
  locale?: string;
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
  return asset.split(/[:/]/).at(-1)!;
}

// Linear-time helpers: regular expressions over caller-supplied digit strings
// (lookahead grouping, /0+$/) can take quadratic time on long inputs.
function groupDigits(value: string): string {
  let out = "";
  for (let i = 0; i < value.length; i++)
    out += (i && (value.length - i) % 3 === 0 ? "," : "") + value[i];
  return out;
}

function trimTrailingZeros(value: string): string {
  let end = value.length;
  while (value[end - 1] === "0") end--;
  return value.slice(0, end);
}

export function formatAuthorizationAmount(
  amount: bigint,
  metadata: AuthorizationAssetMetadata | undefined,
): AuthorizationAmountView {
  const baseUnits = amount.toString();
  if (
    !metadata ||
    !metadata.symbol ||
    !Number.isSafeInteger(metadata.decimals) ||
    metadata.decimals < 0 ||
    metadata.decimals > 255 // ERC-20 decimals are a uint8
  ) {
    return {
      formatted: `${groupDigits(baseUnits)} base units`,
    };
  }
  const decimals = metadata.decimals;
  const padded = baseUnits.padStart(decimals + 1, "0");
  const integer = decimals === 0 ? padded : padded.slice(0, -decimals);
  const fraction =
    decimals === 0 ? "" : trimTrailingZeros(padded.slice(-decimals));
  const value = `${groupDigits(integer)}${fraction ? `.${fraction}` : ""}`;
  return { formatted: `${value} ${metadata.symbol}` };
}

function relativeExpiry(
  expiresAt: number,
  now: number,
  locale?: string,
): string {
  const seconds = expiresAt - now;
  const absolute = Math.abs(seconds);
  const divisor =
    absolute >= 31_536_000
      ? 31_536_000
      : absolute >= 2_592_000
        ? 2_592_000
        : absolute >= 86_400
          ? 86_400
          : absolute >= 3_600
            ? 3_600
            : absolute >= 60
              ? 60
              : 1;
  const unit =
    divisor === 31_536_000
      ? "year"
      : divisor === 2_592_000
        ? "month"
        : divisor === 86_400
          ? "day"
          : divisor === 3_600
            ? "hour"
            : divisor === 60
              ? "minute"
              : "second";
  return new Intl.RelativeTimeFormat(locale).format(
    Math.round(seconds / divisor),
    unit,
  );
}

/** Build a network-free consent/listing view of an authorization. */
export function describeAuthorization(
  input: Authorization | ListedAuthorization,
  options: DescribeAuthorizationOptions = {},
): AuthorizationDescription {
  const now = options.now ?? Math.floor(Date.now() / 1_000);
  const locale = options.locale ?? "en";
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
          shortened:
            full.length <= 14 ? full : `${full.slice(0, 6)}…${full.slice(-6)}`,
          full,
        })),
        perPayment: formatAuthorizationAmount(grant.maxPerPayment, metadata),
        total: formatAuthorizationAmount(grant.maxTotal, metadata),
        count: grant.maxCount ?? null,
        rails: grant.rails.map((r) => r.replace("-", " ")),
      };
    }),
    expiry: {
      timestamp: input.expiresAt,
      absolute: new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
        timeZone: "UTC",
        timeZoneName: "short",
      }).format(input.expiresAt * 1_000),
      relative: relativeExpiry(input.expiresAt, now, locale),
    },
    warnings: flags.map((flag) =>
      flag === "unrestricted-recipient-legacy"
        ? "This key can pay any recipient."
        : "This key can do more than shown here.",
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
  const remainingTotalFormatted = formatAuthorizationAmount(
    remainingTotal,
    options.assets?.[authorization.grants[verdict.grant].asset],
  );
  return {
    allowed: true,
    grant: verdict.grant,
    remainingTotal,
    remainingTotalFormatted,
    sentence: `Allowed by grant ${verdict.grant + 1}; ${remainingTotalFormatted.formatted} remain.`,
  };
}
