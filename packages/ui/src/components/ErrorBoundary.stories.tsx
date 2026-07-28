import type { StoryDefault, Story } from "@ladle/react"
import { ErrorBoundary } from "./ErrorBoundary"

export default {
  title: "ErrorBoundary",
} satisfies StoryDefault

function BuggyComponent(): React.ReactNode {
  throw new Error("Something went wrong!")
}

function SafeComponent() {
  return (
    <div className="p-4 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))]">
      Everything is working fine.
    </div>
  )
}

export const NoError: Story = () => (
  <ErrorBoundary key="no-error">
    <SafeComponent />
  </ErrorBoundary>
)

export const WithError: Story = () => (
  <ErrorBoundary key="with-error">
    <BuggyComponent />
  </ErrorBoundary>
)

export const CustomFallback: Story = () => (
  <ErrorBoundary
    key="custom-fallback"
    fallback={({ error, reset }) => (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-2">Custom Error: {error.message}</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-lg"
        >
          Try Again
        </button>
      </div>
    )}
  >
    <BuggyComponent />
  </ErrorBoundary>
)

export const WithDismiss: Story = () => (
  <ErrorBoundary key="with-dismiss" onDismiss={() => {}}>
    <BuggyComponent />
  </ErrorBoundary>
)
