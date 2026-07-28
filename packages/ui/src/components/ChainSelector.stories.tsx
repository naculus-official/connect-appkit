import type { StoryDefault, Story } from "@ladle/react"
import { Web3Context } from "@naculus/connect-appkit-react"
import type { WalletChain } from "@naculus/connect-appkit-react"
import { ChainSelector } from "./ChainSelector"

const ethChain: WalletChain = { id: 1, namespace: "eip155" as any, name: "Ethereum", token: "ETH" }
const polygon: WalletChain = { id: 137, namespace: "eip155" as any, name: "Polygon", token: "MATIC" }
const optimism: WalletChain = { id: 10, namespace: "eip155" as any, name: "Optimism", token: "OP" }

const multiChains = [ethChain, polygon, optimism]
const singleChain = [ethChain]

function mockContext(chains: WalletChain[]) {
  return {
    status: "connected" as const,
    session: null,
    accounts: ["0x1234"],
    chainId: "eip155:1",
    error: null,
    isConnected: true,
    chains,
    startPairing: async () => "wc:mock",
    completePairing: async () => ({}),
    connect: async () => {},
    connectInjected: async () => {},
    connectEmbedded: async () => {},
    connectPasskeys: async () => {},
    disconnect: async () => {},
    reconnect: async () => {},
    switchChain: async () => {},
  }
}

function Wrapper({ chains = multiChains, children }: { chains?: WalletChain[]; children: React.ReactNode }) {
  return <Web3Context.Provider value={mockContext(chains) as any}>{children}</Web3Context.Provider>
}

export default {
  title: "ChainSelector",
} satisfies StoryDefault

export const Dropdown: Story = () => (
  <Wrapper key="dropdown"><ChainSelector /></Wrapper>
)

export const WithLabel: Story = () => (
  <Wrapper key="with-label"><ChainSelector showLabel /></Wrapper>
)

export const Minimal: Story = () => (
  <Wrapper key="minimal"><ChainSelector variant="minimal" /></Wrapper>
)

export const Buttons: Story = () => (
  <Wrapper key="buttons"><ChainSelector variant="buttons" /></Wrapper>
)

export const SingleChain: Story = () => (
  <Wrapper key="single-chain" chains={singleChain}><ChainSelector /></Wrapper>
)
