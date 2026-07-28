import type { StoryDefault, Story } from "@ladle/react"
import { ThemeProvider } from "../contexts/ThemeContext"
import { Web3ComponentProvider } from "../contexts/ComponentRegistry"

export default {
  title: "AppKit",
  decorators: [
    (Component) => (
      <ThemeProvider>
        <Web3ComponentProvider>
          <Component />
        </Web3ComponentProvider>
      </ThemeProvider>
    ),
  ],
} satisfies StoryDefault

/**
 * AppKit requires a projectId and metadata to function.
 * In a real app you would pass these from your WalletConnect Cloud project.
 * This story shows the component structure — the connect flow
 * requires WalletConnect context at runtime.
 */
export const Structure: Story = () => (
  <div key="structure" className="p-8 space-y-4">
    <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">
      AppKit All-in-One Component
    </h2>
    <p className="text-sm text-[hsl(var(--muted-foreground))]">
      AppKit wraps Web3ConnectUI and provides AppKitButton + AppKitChainSelector.
      Requires <code className="text-xs bg-[hsl(var(--muted))] px-1 rounded">projectId</code> and
      wallet metadata at runtime.
    </p>
    <div className="flex flex-wrap gap-3">
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2 text-sm text-[hsl(var(--foreground))]">
        AppKitButton placeholder
      </div>
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2 text-sm text-[hsl(var(--foreground))]">
        AppKitChainSelector placeholder
      </div>
    </div>
  </div>
)
