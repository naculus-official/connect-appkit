import type { StoryDefault, Story } from "@ladle/react"
import { AccountButton } from "./AccountButton"

export default {
  title: "AccountButton",
} satisfies StoryDefault

export const Default: Story = () => <AccountButton key="default" />

export const WithAddress: Story = () => (
  <AccountButton key="with-address" address="0x1234567890abcdef1234567890abcdef12345678" />
)

export const WithBalance: Story = () => (
  <AccountButton
    key="with-balance"
    address="0x1234567890abcdef1234567890abcdef12345678"
    balance="1.234"
    balanceSymbol="ETH"
    showBalance
  />
)

export const BalanceLoading: Story = () => (
  <AccountButton
    key="balance-loading"
    address="0x1234567890abcdef1234567890abcdef12345678"
    balance={null}
    balanceSymbol="ETH"
    showBalance
  />
)

export const WithoutAddress: Story = () => (
  <AccountButton key="without-address" showBalance={false} />
)
