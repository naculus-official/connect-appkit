import type { StoryDefault, Story } from "@ladle/react"
import { useState } from "react"
import { AddressWarningDialog } from "./AddressWarningDialog"

export default {
  title: "AddressWarningDialog",
} satisfies StoryDefault

const TRIGGER_STYLE: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 8,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--background))",
  color: "hsl(var(--foreground))",
  cursor: "pointer",
}

export const Safe: Story = () => {
  const [open, setOpen] = useState(true)
  return (
    <div>
      <button style={TRIGGER_STYLE} onClick={() => setOpen(true)}>
        Open Safe Dialog
      </button>
      <AddressWarningDialog
        address="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"
        open={open}
        onClose={() => setOpen(false)}
      />
    </div>
  )
}

export const Warning: Story = () => {
  const [open, setOpen] = useState(true)
  return (
    <div>
      <button style={TRIGGER_STYLE} onClick={() => setOpen(true)}>
        Open Warning Dialog
      </button>
      <AddressWarningDialog
        address="0x000000000000000000000000000000000000dEaD"
        open={open}
        onClose={() => setOpen(false)}
        onProceed={() => setOpen(false)}
      />
    </div>
  )
}

export const Blocked: Story = () => {
  const [open, setOpen] = useState(true)
  return (
    <div>
      <button style={TRIGGER_STYLE} onClick={() => setOpen(true)}>
        Open Blocked Dialog
      </button>
      <AddressWarningDialog
        address="0x0000000000000000000000000000000000000000"
        open={open}
        onClose={() => setOpen(false)}
        onProceed={() => setOpen(false)}
      />
    </div>
  )
}
