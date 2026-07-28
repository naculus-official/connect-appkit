import type { StoryDefault, Story } from "@ladle/react"
import { FallbackButton } from "./FallbackButton"

export default {
  title: "FallbackButton",
} satisfies StoryDefault

export const Default: Story = () => <FallbackButton key="default">Click me</FallbackButton>

export const Outline: Story = () => (
  <FallbackButton key="outline" variant="outline">Outline</FallbackButton>
)

export const Ghost: Story = () => <FallbackButton key="ghost" variant="ghost">Ghost</FallbackButton>

export const Destructive: Story = () => (
  <FallbackButton key="destructive" variant="destructive">Delete</FallbackButton>
)

export const Small: Story = () => <FallbackButton key="small" size="sm">Small</FallbackButton>

export const Large: Story = () => <FallbackButton key="large" size="lg">Large</FallbackButton>

export const Disabled: Story = () => (
  <FallbackButton key="disabled" disabled>Disabled</FallbackButton>
)

export const AsLink: Story = () => (
  <FallbackButton key="as-link" onClick={() => window.open("https://example.com", "_blank")}>
    Open Link
  </FallbackButton>
)
