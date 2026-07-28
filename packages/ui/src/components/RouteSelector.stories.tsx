import type { StoryDefault, Story } from "@ladle/react";
import { RouteSelector } from "./RouteSelector";
import type { Route, Token } from "@naculus/connect-core";

// ── Mock Data ──────────────────────────────────────────────────────────

const ethToken: Token = {
  chainId: 1,
  address: "0x0000000000000000000000000000000000000000",
  decimals: 18,
  symbol: "ETH",
};

const usdcToken: Token = {
  chainId: 137,
  address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  decimals: 6,
  symbol: "USDC",
};

const mockRouteA: Route = {
  id: "mock-route-a",
  provider: "lifi",
  fromChain: "eip155:1",
  toChain: "eip155:137",
  fromToken: "0x0000000000000000000000000000000000000000",
  toToken: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  fromAmount: "1000000000000000000",
  toAmount: "3100000000",
  toAmountMin: "3069000000",
  gasCosts: {
    fromChain: { maxFeePerGas: "20000000000", maxPriorityFeePerGas: "1000000000", gasLimit: "100000", totalCostWei: "2000000000000000", totalCostUsd: "2.50" },
    toChain: { maxFeePerGas: "30000000000", maxPriorityFeePerGas: "1500000000", gasLimit: "200000", totalCostWei: "6000000000000000", totalCostUsd: "3.00" },
    totalUsd: "5.50",
  },
  estimatedTime: 300,
  steps: [
    {
      type: "swap",
      chain: "eip155:1",
      token: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      contractAddress: "0x0",
      estimatedGas: "150000",
    },
  ],
  fee: { protocolFee: "1000000000000000" },
  summary: "LiFi — ETH → USDC via swap",
};

const mockRouteB: Route = {
  id: "mock-route-b",
  provider: "axelar",
  fromChain: "eip155:1",
  toChain: "eip155:137",
  fromToken: "0x0000000000000000000000000000000000000000",
  toToken: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  fromAmount: "1000000000000000000",
  toAmount: "3098000000",
  toAmountMin: "3067020000",
  gasCosts: {
    fromChain: { maxFeePerGas: "20000000000", maxPriorityFeePerGas: "1000000000", gasLimit: "100000", totalCostWei: "2000000000000000", totalCostUsd: "2.50" },
    toChain: { maxFeePerGas: "30000000000", maxPriorityFeePerGas: "1500000000", gasLimit: "200000", totalCostWei: "6000000000000000", totalCostUsd: "3.00" },
    totalUsd: "4.20",
  },
  estimatedTime: 600,
  steps: [
    {
      type: "swap",
      chain: "eip155:1",
      token: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      contractAddress: "0x0",
      estimatedGas: "150000",
    },
  ],
  fee: { protocolFee: "800000000000000" },
  summary: "Axelar — ETH → USDC via swap",
};

// ── Stories ────────────────────────────────────────────────────────────

export default {
  title: "RouteSelector",
} satisfies StoryDefault;

export const Loading: Story = () => (
  <RouteSelector
    key="loading"
    inputToken={{ chainId: 1, address: ethToken.address, symbol: "ETH" }}
    outputToken={{ chainId: 137, address: usdcToken.address, symbol: "USDC" }}
    amount={1000000000000000000n}
    loading
  />
);

export const MultipleRoutes: Story = () => (
  <RouteSelector
    key="multiple-routes"
    inputToken={{ chainId: 1, address: ethToken.address, symbol: "ETH" }}
    outputToken={{ chainId: 137, address: usdcToken.address, symbol: "USDC" }}
    amount={1000000000000000000n}
    routes={[mockRouteA, mockRouteB]}
    onRouteSelected={(r) => console.log("Selected route:", r)}
    onCancel={() => console.log("Cancelled")}
  />
);

export const Executing: Story = () => (
  <RouteSelector
    key="executing"
    inputToken={{ chainId: 1, address: ethToken.address, symbol: "ETH" }}
    outputToken={{ chainId: 137, address: usdcToken.address, symbol: "USDC" }}
    amount={1000000000000000000n}
    routes={[mockRouteA]}
    executing
    onCancel={() => console.log("Cancelled")}
  />
);

export const Success: Story = () => (
  <RouteSelector
    key="success"
    inputToken={{ chainId: 1, address: ethToken.address, symbol: "ETH" }}
    outputToken={{ chainId: 137, address: usdcToken.address, symbol: "USDC" }}
    amount={1000000000000000000n}
    successTxHash="0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
  />
);

export const ErrorState: Story = () => (
  <RouteSelector
    key="error"
    inputToken={{ chainId: 1, address: ethToken.address, symbol: "ETH" }}
    outputToken={{ chainId: 137, address: usdcToken.address, symbol: "USDC" }}
    amount={1000000000000000000n}
    error="Insufficient liquidity for this route"
    onCancel={() => console.log("Cancelled")}
  />
);

export const Empty: Story = () => (
  <RouteSelector
    key="empty"
    inputToken={{ chainId: 1, address: ethToken.address, symbol: "ETH" }}
    outputToken={{ chainId: 137, address: usdcToken.address, symbol: "USDC" }}
    amount={1000000000000000000n}
    routes={[]}
    onCancel={() => console.log("Cancelled")}
  />
);
