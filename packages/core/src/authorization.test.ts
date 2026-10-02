import type {
  Authorization,
  ListedAuthorization,
  SpendRequest,
} from "@naculus/connect-core";
import { describe, expect, it } from "vitest";
import { describeAuthorization, explainSpend } from "./authorization";

const ASSET = "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const RECIPIENT = "0x209693Bc6afc0C5328bA36FaF03C514EF312287C";

function authorization(over: Partial<Authorization> = {}): Authorization {
  return {
    version: 1,
    principal: "eip155:8453:0x1111111111111111111111111111111111111111",
    label: "API budget",
    grants: [
      {
        asset: ASSET,
        recipients: [RECIPIENT],
        maxPerPayment: 2_000_000n,
        maxTotal: 10_000_000n,
        maxCount: 3,
        rails: ["x402-exact"],
      },
    ],
    expiresAt: 2_000_000_000,
    ...over,
  };
}

function request(over: Partial<SpendRequest> = {}): SpendRequest {
  return {
    asset: ASSET,
    recipient: RECIPIENT,
    amount: 1_000_000n,
    rail: "x402-exact",
    at: 1_900_000_000,
    spentSoFar: 2_000_000n,
    countSoFar: 1,
    ...over,
  };
}

describe("describeAuthorization", () => {
  it("formats known metadata and never guesses unknown asset metadata", () => {
    const known = describeAuthorization(authorization(), {
      assets: { [ASSET]: { symbol: "USDC", decimals: 6 } },
      now: 1_999_913_600,
    });
    expect(known.grants[0]).toMatchObject({
      assetLabel: "USDC",
      perPayment: { formatted: "2 USDC" },
      total: { formatted: "10 USDC" },
      count: 3,
      rails: ["x402 exact"],
      recipients: [{ shortened: "0x2096…12287C", full: RECIPIENT }],
    });
    expect(known.expiry.relative).toBe("in 86,400 seconds");

    const unknown = describeAuthorization(authorization(), {
      now: 2_000_000_001,
    });
    expect(unknown.grants[0]).toMatchObject({
      assetLabel: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      perPayment: { formatted: "2000000 base units" },
    });
    expect(unknown.expiry.relative).toBe("1 second ago");
  });

  it("turns every listing flag into its required warning", () => {
    const listed = {
      ...authorization(),
      keyId: "key-1",
      status: "active",
      enforcer: "evm-session",
      flags: ["unrestricted-recipient-legacy", "not-expressible"],
      raw: {},
    } as unknown as ListedAuthorization;
    expect(
      describeAuthorization(listed, { now: 1_900_000_000 }).warnings,
    ).toEqual([
        "Strong warning: key can pay any recipient",
      "this key can do more than shown",
    ]);
  });
});

describe("explainSpend", () => {
  it.each([
    [
      "expired",
      authorization(),
      request({ at: 2_000_000_000 }),
      "This authorization has expired.",
    ],
    [
      "not-yet-valid",
      authorization({ notBefore: 1_950_000_000 }),
      request(),
      "This authorization is not valid yet.",
    ],
    [
      "no-matching-grant",
      authorization(),
      request({
        asset: "eip155:8453/erc20:0x1111111111111111111111111111111111111111",
      }),
      "No grant covers this asset.",
    ],
    [
      "recipient-not-allowed",
      authorization(),
      request({ recipient: "0x2222222222222222222222222222222222222222" }),
      "This recipient is not allowed.",
    ],
    [
      "over-per-payment",
      authorization(),
      request({ amount: 2_000_001n }),
      "This amount exceeds the per-payment limit.",
    ],
    [
      "over-total",
      authorization(),
      request({ amount: 2_000_000n, spentSoFar: 9_000_000n }),
      "This amount exceeds the remaining total limit.",
    ],
    [
      "over-count",
      authorization(),
      request({ countSoFar: 3 }),
      "This authorization has reached its payment count limit.",
    ],
    [
      "rail-not-allowed",
      authorization(),
      request({ rail: "transfer" }),
      "This payment rail is not allowed.",
    ],
    [
      "invalid-authorization",
      authorization(),
      request({ amount: 0n }),
      "The authorization or spend request is invalid.",
    ],
  ] as const)(
    "maps %s to a stable sentence",
    (reason, auth, spend, sentence) => {
      expect(explainSpend(auth, spend)).toEqual({
        allowed: false,
        reason,
        sentence,
      });
    },
  );

  it("reports the matching grant and remaining total", () => {
    expect(explainSpend(authorization(), request())).toEqual({
      allowed: true,
      grant: 0,
      remainingTotal: 7_000_000n,
      remainingTotalFormatted: {
        formatted: "7000000 base units",
      },
      sentence: "Allowed by grant 1; 7000000 base units remain.",
    });
  });
});
