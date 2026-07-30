import type { Meta, StoryObj } from "@storybook/react"
import { AppkitSelect } from "@naculus/connect-appkit-react"

const meta: Meta<typeof AppkitSelect> = {
  title: "WC/Select",
  component: AppkitSelect,
  tags: ["autodocs"],
}
export default meta
type Story = StoryObj<typeof meta>

const opts = JSON.stringify([
  { value: "eth", label: "Ethereum" },
  { value: "polygon", label: "Polygon" },
  { value: "arbitrum", label: "Arbitrum" },
  { value: "optimism", label: "Optimism" },
])

export const Default: Story = { args: { optionsJson: opts, placeholder: "Select a network" } }
export const Selected: Story = { args: { optionsJson: opts, value: "eth" } }
