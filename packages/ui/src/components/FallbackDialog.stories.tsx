import type { StoryDefault, Story } from "@ladle/react"
import { useState } from "react"
import { FallbackDialog, FallbackDialogHeader, FallbackDialogContent } from "./FallbackDialog"
import { FallbackButton } from "./FallbackButton"

export default {
  title: "FallbackDialog",
} satisfies StoryDefault

export const Closed: Story = () => (
  <FallbackDialog key="closed" isOpen={false} onClose={() => {}}>
    <div>Content</div>
  </FallbackDialog>
)

export const Simple: Story = () => {
  const [open, setOpen] = useState(true)
  return (
    <>
      <FallbackButton key="simple-trigger" onClick={() => setOpen(true)}>Open Dialog</FallbackButton>
      <FallbackDialog key="simple-dialog" isOpen={open} onClose={() => setOpen(false)}>
        <FallbackDialogHeader title="Hello" onClose={() => setOpen(false)} />
        <FallbackDialogContent>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">This is a simple dialog with some content.</p>
          <FallbackButton key="simple-close" onClick={() => setOpen(false)}>Close</FallbackButton>
        </FallbackDialogContent>
      </FallbackDialog>
    </>
  )
}

export const WithLongContent: Story = () => {
  const [open, setOpen] = useState(true)
  return (
    <FallbackDialog key="long-content" isOpen={open} onClose={() => setOpen(false)}>
      <FallbackDialogHeader title="Long Content" onClose={() => setOpen(false)} />
      <div className="space-y-3">
        {Array.from({ length: 20 }, (_, i) => (
          <p key={i} className="text-sm text-[hsl(var(--muted-foreground))]">
            Item {i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
        ))}
      </div>
    </FallbackDialog>
  )
}

export const Destructive: Story = () => {
  const [open, setOpen] = useState(true)
  return (
    <>
      <FallbackButton key="destructive-trigger" onClick={() => setOpen(true)} variant="outline">Open Dialog</FallbackButton>
      <FallbackDialog key="destructive-dialog" isOpen={open} onClose={() => setOpen(false)}>
        <FallbackDialogHeader title="Delete Account" onClose={() => setOpen(false)} />
        <FallbackDialogContent>
          <p className="text-sm text-[hsl(var(--destructive))] font-medium">This action cannot be undone.</p>
          <div className="flex gap-2">
            <FallbackButton key="cancel" onClick={() => setOpen(false)} variant="outline" className="flex-1">Cancel</FallbackButton>
            <FallbackButton key="delete" onClick={() => setOpen(false)} variant="destructive" className="flex-1">Delete</FallbackButton>
          </div>
        </FallbackDialogContent>
      </FallbackDialog>
    </>
  )
}

export const WithoutCloseButton: Story = () => {
  const [open, setOpen] = useState(true)
  return (
    <>
      <FallbackButton key="no-close-trigger" onClick={() => setOpen(true)}>Open Dialog</FallbackButton>
      <FallbackDialog key="no-close-dialog" isOpen={open} onClose={() => setOpen(false)}>
        <FallbackDialogHeader title="Notice" showCloseButton={false} />
        <FallbackDialogContent>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Click outside or press the button to dismiss.</p>
          <FallbackButton key="got-it" onClick={() => setOpen(false)}>Got it</FallbackButton>
        </FallbackDialogContent>
      </FallbackDialog>
    </>
  )
}
