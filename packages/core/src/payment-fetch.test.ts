import { describe, expect, it } from "vitest";
import { describePayment, type PaymentFetchResult } from "./payment-fetch";

const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const PAYEE = "0x209693Bc6afc0C5328bA36FaF03C514EF312287C";
const TX = `0x${"ab".repeat(32)}`;
const URL_ = "https://api.example.com/data";

function result(over: Partial<PaymentFetchResult>): PaymentFetchResult {
  return { response: new Response("ok"), paid: null, ...over };
}

describe("describePayment", () => {
  it("is null when nothing was paid", () => {
    expect(describePayment(URL_, result({}))).toBeNull();
  });

  it("reads an x402 requirement and its settlement", () => {
    const paid = {
      scheme: "exact",
      network: "eip155:8453",
      amount: "10000",
      asset: USDC,
      payTo: PAYEE,
      maxTimeoutSeconds: 60,
    };
    expect(
      describePayment(
        new Request(URL_),
        result({
          paid,
          settlement: {
            success: true,
            transaction: TX,
            network: "eip155:8453",
          },
        }),
      ),
    ).toEqual({
      protocol: "x402",
      resource: URL_,
      chainId: "eip155:8453",
      asset: USDC,
      payTo: PAYEE,
      amount: "10000",
      reference: TX,
    });
    // A failed or missing settlement names no transaction.
    expect(
      describePayment(
        URL_,
        result({ paid, settlement: { success: false, transaction: TX } }),
      )?.reference,
    ).toBeNull();
    expect(describePayment(URL_, result({ paid }))?.reference).toBeNull();
    expect(
      describePayment(
        URL_,
        result({
          paid,
          settlement: { success: true, transaction: TX, network: "eip155:1" },
        }),
      )?.reference,
    ).toBeNull();
  });

  it("reads an MPP evm charge and its receipt", () => {
    const paid = {
      challenge: {
        params: { id: "c1", realm: "api", method: "evm", intent: "charge" },
        request: {},
      },
      request: {
        amount: "250000",
        currency: USDC,
        recipient: PAYEE,
        chainId: 8453,
      },
      domain: {},
    };
    expect(
      describePayment(
        new URL(URL_),
        result({ paid, receipt: { status: "success", reference: TX } }),
      ),
    ).toEqual({
      protocol: "mpp",
      resource: URL_,
      chainId: "eip155:8453",
      asset: USDC,
      payTo: PAYEE,
      amount: "250000",
      reference: TX,
    });
  });

  it("does not invent a chain for a non-evm MPP method", () => {
    const paid = {
      challenge: { params: { method: "solana" } },
      request: { amount: "1", currency: "So1", recipient: "Rx", chainId: 1 },
    };
    expect(describePayment(URL_, result({ paid }))?.chainId).toBeNull();
  });

  it("reports an unrecognised shape as unknown rather than guessing", () => {
    expect(describePayment(URL_, result({ paid: { amount: "5" } }))).toEqual({
      protocol: "unknown",
      resource: URL_,
      chainId: null,
      asset: null,
      payTo: null,
      amount: null,
      reference: null,
    });
  });
});
