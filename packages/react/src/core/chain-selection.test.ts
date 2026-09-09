/// <reference types="vitest" />
import { describe, expect, it } from "vitest";
import {
  chainsForNamespace,
  describeChain,
  resolveChain,
} from "./chain-selection";
import type { WalletChain } from "../types";

const SOLANA_CHAIN = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";

const CHAINS: WalletChain[] = [
  { id: 1, namespace: "eip155", name: "Ethereum" },
  { id: 137, namespace: "eip155", name: "Polygon" },
  { id: 0, namespace: "solana", name: "Solana" },
];

describe("resolveChain", () => {
  it("finds a configured EVM chain", () => {
    expect(resolveChain(CHAINS, "eip155:137")?.name).toBe("Polygon");
  });

  // The bug: parseInt on a base58 reference answers 5, and an entry with
  // id 5 would have matched a Solana cluster.
  it("does not match a Solana chain against a number", () => {
    expect(resolveChain(CHAINS, SOLANA_CHAIN)).toBeNull();
    const withFive: WalletChain[] = [
      ...CHAINS,
      { id: 5, namespace: "eip155", name: "Goerli" },
    ];
    expect(resolveChain(withFive, SOLANA_CHAIN)).toBeNull();
  });

  it("is null for an unconfigured or absent chain", () => {
    expect(resolveChain(CHAINS, "eip155:8453")).toBeNull();
    expect(resolveChain(CHAINS, null)).toBeNull();
    expect(resolveChain(CHAINS, "nonsense")).toBeNull();
  });
});

describe("chainsForNamespace", () => {
  // The live defect: a Solana wallet was offered Ethereum and Polygon, and
  // clicking one asked it to switch to a chain it has no concept of.
  it("offers only chains the connected wallet could switch to", () => {
    expect(chainsForNamespace(CHAINS, SOLANA_CHAIN).map((c) => c.name)).toEqual(
      ["Solana"],
    );
    expect(chainsForNamespace(CHAINS, "eip155:1").map((c) => c.name)).toEqual([
      "Ethereum",
      "Polygon",
    ]);
  });

  // Nothing has been ruled out yet, and hiding the list would leave a user
  // unable to pick at all.
  it("offers everything when no chain is connected", () => {
    expect(chainsForNamespace(CHAINS, null)).toHaveLength(3);
    expect(chainsForNamespace(CHAINS, undefined)).toHaveLength(3);
  });

  it("offers everything rather than nothing for an unreadable chain id", () => {
    expect(chainsForNamespace(CHAINS, "garbage")).toHaveLength(3);
  });
});

describe("describeChain", () => {
  it("names a configured chain", () => {
    expect(describeChain(CHAINS, "eip155:1")).toEqual({
      namespace: "eip155",
      chainId: "eip155:1",
      name: "Ethereum",
      selected: true,
    });
  });

  // It used to return null for anything not EIP-155, so a connected Solana
  // wallet had no chain to display and the UI showed "Unknown Chain".
  it("describes a non-EVM chain instead of answering null", () => {
    const info = describeChain(CHAINS, SOLANA_CHAIN);
    expect(info?.namespace).toBe("solana");
    expect(info?.chainId).toBe(SOLANA_CHAIN);
  });

  it("names an unconfigured EVM chain by its reference", () => {
    expect(describeChain(CHAINS, "eip155:8453")?.name).toBe("Chain 8453");
  });

  // "Chain 5" for a Solana cluster would be a fabrication.
  it("does not invent a number for a non-EVM reference", () => {
    expect(describeChain([], SOLANA_CHAIN)?.name).toBe(
      "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
    );
  });

  it("is null with no chain", () => {
    expect(describeChain(CHAINS, null)).toBeNull();
  });
});

describe("framework boundary", () => {
  it("imports nothing from a framework", async () => {
    const fs = await import("node:fs/promises");
    const source = await fs.readFile(
      new URL("./chain-selection.ts", import.meta.url),
      "utf8",
    );
    expect(source).not.toMatch(/from "react"/);
    expect(source).not.toMatch(/from "vue"/);
  });
});
