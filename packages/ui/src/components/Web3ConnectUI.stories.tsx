import React from "react"
import type { Web3ConnectConfig } from "@naculus/connect-appkit-react"
import { Web3ConnectUI } from "./Web3ConnectUI"

export default {
  title: "Web3ConnectUI",
}

const mockConfig: Web3ConnectConfig = {
  projectId: "mock-project-id",
  metadata: {
    name: "Test App",
    description: "Test app for storybook",
    url: "https://example.com",
    icons: ["https://example.com/icon.png"],
  },
}

export const EIP6963Only = () => (
  <Web3ConnectUI config={mockConfig} detectionMode="eip6963">
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <p style={{ marginBottom: "1rem", color: "var(--foreground)" }}>
        Web3ConnectUI — EIP-6963 mode
      </p>
      <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
        WalletConnect relay skipped (wallet detection only)
      </p>
    </div>
  </Web3ConnectUI>
)

export const WalletConnectMode = () => (
  <Web3ConnectUI config={mockConfig} detectionMode="walletconnect">
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <p style={{ marginBottom: "1rem", color: "var(--foreground)" }}>
        Web3ConnectUI — WalletConnect mode
      </p>
      <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
        WalletConnect relay enabled
      </p>
    </div>
  </Web3ConnectUI>
)
