import type { StoryDefault, Story } from "@ladle/react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./dialog"
import { Button } from "./button"

export default {
  title: "UI/Dialog",
} satisfies StoryDefault

export const Default: Story = () => {
  const [open, setOpen] = useState(true)
  return (
    <Dialog key="default-dialog" open={open} onOpenChange={setOpen}>
      <Button key="open-dialog-btn" onClick={() => setOpen(true)}>Open Dialog</Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm">Name</label>
            <input
              className="col-span-3 rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
              defaultValue="Pedro Duarte"
            />
          </div>
        </div>
        <DialogFooter>
          <Button key="save" onClick={() => setOpen(false)}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const WithLongContent: Story = () => {
  const [open, setOpen] = useState(true)
  return (
    <Dialog key="long-content" open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Terms of Service</DialogTitle>
          <DialogDescription>Please read these terms carefully.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm text-[hsl(var(--muted-foreground))]">
          {Array.from({ length: 15 }, (_, i) => (
            <p key={i}>
              Section {i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          ))}
        </div>
        <DialogFooter>
          <Button key="accept" onClick={() => setOpen(false)}>Accept</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const BottomSheet: Story = () => {
  const [open, setOpen] = useState(true)
  return (
    <Dialog key="bottom-sheet" open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bottom Sheet</DialogTitle>
          <DialogDescription>Renders as a bottom sheet on mobile viewports.</DialogDescription>
        </DialogHeader>
        <div className="py-4 text-sm text-[hsl(var(--muted-foreground))]">
          Resize your browser to &lt;640px wide to see the bottom-sheet behavior.
        </div>
        <DialogFooter>
          <Button key="close" onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const Destructive: Story = () => {
  const [open, setOpen] = useState(true)
  return (
    <Dialog key="destructive-dialog" open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Account</DialogTitle>
          <DialogDescription>
            This action cannot be undone. All data will be permanently removed.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 text-sm text-[hsl(var(--muted-foreground))]">
          Are you sure you want to delete your account? This includes your profile, settings, and wallet history.
        </div>
        <DialogFooter>
          <Button key="cancel" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button key="delete" variant="destructive" onClick={() => setOpen(false)}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
