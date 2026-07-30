import type { Meta, StoryObj } from "@storybook/react"
import { AppkitSwitch } from "@naculus/connect-appkit-react"

const meta: Meta<typeof AppkitSwitch> = {
  title: "WC/Switch",
  component: AppkitSwitch,
  tags: ["autodocs"],
}
export default meta
type Story = StoryObj<typeof meta>

export const Off: Story = { args: { label: "Dark mode" } }
export const On: Story = { args: { checked: true, label: "Dark mode" } }
export const Disabled: Story = { args: { label: "Disabled", disabled: true } }
