import type { Meta, StoryObj } from "@storybook/react"
import { AppkitDialog, AppkitButton } from "@naculus/connect-appkit-react"
import { useState } from "react"

const DialogDemo = ({ title }: { title: string }) => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <AppkitButton onClick={() => setOpen(true)}>Open Dialog</AppkitButton>
      <AppkitDialog open={open} heading={title} onAppkitClose={() => setOpen(false)}>
        <p>This is the dialog content. Press Escape or click outside to close.</p>
      </AppkitDialog>
    </>
  )
}

const meta: Meta<typeof AppkitDialog> = {
  title: "WC/Dialog",
  component: AppkitDialog,
  tags: ["autodocs"],
}
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <DialogDemo title="Confirm Action" />,
}
