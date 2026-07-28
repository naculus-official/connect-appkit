import type { StoryDefault, Story } from "@ladle/react"
import { ConnectButton } from "./ConnectButton"
import { Web3ComponentProvider } from "../contexts/ComponentRegistry"
import { ThemeProvider } from "../contexts/ThemeContext"

export default {
  title: "ConnectButton",
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Web3ComponentProvider>
          <div className="flex min-h-[200px] items-center justify-center p-8">
            <Story />
          </div>
        </Web3ComponentProvider>
      </ThemeProvider>
    ),
  ],
} satisfies StoryDefault

export const Disconnected: Story = () => <ConnectButton key="disconnected" />

export const Connecting: Story = () => <ConnectButton key="connecting" isConnecting />

export const Connected: Story = () => (
  <ConnectButton
    key="connected"
    isConnected
    address="0x1234567890abcdef1234567890abcdef12345678"
    balance="1.234"
    balanceSymbol="ETH"
  />
)

export const WithLongBalance: Story = () => (
  <ConnectButton
    key="with-long-balance"
    isConnected
    address="0xabcdef1234567890abcdef1234567890abcdef12"
    balance="12345.678901234"
    balanceSymbol="USDC"
  />
)

export const BalanceLoading: Story = () => (
  <ConnectButton
    key="balance-loading"
    isConnected
    address="0x1234567890abcdef1234567890abcdef12345678"
    balance={null}
    balanceSymbol="ETH"
    isBalanceLoading
  />
)
