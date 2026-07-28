import type { StoryDefault, Story } from "@ladle/react"
import { SmartWalletSettings } from "./SmartWalletSettings"
import { Web3ComponentProvider } from "../contexts/ComponentRegistry"
import { ThemeProvider } from "../contexts/ThemeContext"
import type { SmartWalletConfig } from "./SmartWalletSettings"

export default {
  title: "SmartWalletSettings",
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

export const Basic: Story = () => (
  <SmartWalletSettings
    key="basic"
    onSave={(config) => console.log("Saved:", config)}
    onBack={() => {}}
  />
)

export const MultiSigSelected: Story = () => {
  const config: SmartWalletConfig = {
    accountType: "multi-sig",
    paymasterType: "self",
    customPaymasterUrl: "",
    bundlerPreset: "pimlico",
    customBundlerUrl: "",
    guardians: [],
    threshold: 2,
  }
  return (
    <SmartWalletSettings
      key="multi-sig"
      currentConfig={config}
      onSave={(c) => console.log("Saved:", c)}
      onBack={() => {}}
    />
  )
}

export const SocialRecoverySelected: Story = () => {
  const config: SmartWalletConfig = {
    accountType: "social-recovery",
    paymasterType: "sponsor",
    customPaymasterUrl: "",
    bundlerPreset: "pimlico",
    customBundlerUrl: "",
    guardians: [
      "0x1234567890abcdef1234567890abcdef12345678",
      "0xabcdef1234567890abcdef1234567890abcdef12",
    ],
    threshold: 2,
  }
  return (
    <SmartWalletSettings
      key="social-recovery"
      currentConfig={config}
      onSave={(c) => console.log("Saved:", c)}
      onBack={() => {}}
    />
  )
}

export const CustomPaymasterAndBundler: Story = () => {
  const config: SmartWalletConfig = {
    accountType: "simple",
    paymasterType: "custom",
    customPaymasterUrl: "https://paymaster.example.com/v1/rpc",
    bundlerPreset: "custom",
    customBundlerUrl: "https://bundler.example.com/rpc",
    guardians: [],
    threshold: 2,
  }
  return (
    <SmartWalletSettings
      key="custom"
      currentConfig={config}
      onSave={(c) => console.log("Saved:", c)}
      onBack={() => {}}
    />
  )
}
