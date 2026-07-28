import type { StoryDefault, Story } from "@ladle/react"
import { SmartWalletToggle } from "./SmartWalletToggle"
import { Web3ComponentProvider } from "../contexts/ComponentRegistry"
import { ThemeProvider } from "../contexts/ThemeContext"

export default {
  title: "SmartWalletToggle",
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Web3ComponentProvider>
          <div className="flex min-h-[200px] items-center justify-center p-8">
            <div className="w-full max-w-md">
              <Story />
            </div>
          </div>
        </Web3ComponentProvider>
      </ThemeProvider>
    ),
  ],
} satisfies StoryDefault

export const NotDeployed: Story = () => (
  <SmartWalletToggle
    key="not-deployed"
    estimatedGas={BigInt("2000000000000000")}
    onUpgrade={() => {}}
    onShowSettings={() => {}}
  />
)

export const Deploying: Story = () => (
  <SmartWalletToggle
    key="deploying"
    isDeploying
    onUpgrade={() => {}}
    onShowSettings={() => {}}
  />
)

export const Deployed: Story = () => (
  <SmartWalletToggle
    key="deployed"
    isDeployed
    onShowSettings={() => {}}
  />
)

export const Error: Story = () => (
  <SmartWalletToggle
    key="error"
    error="Transaction reverted: insufficient funds for gas * price + value"
    onRetry={() => {}}
    onShowSettings={() => {}}
  />
)

export const BackToSimpleMode: Story = () => (
  <div className="space-y-4">
    <SmartWalletToggle
      key="setting-up"
      isDeployed
      onShowSettings={() => {}}
    />
  </div>
)
