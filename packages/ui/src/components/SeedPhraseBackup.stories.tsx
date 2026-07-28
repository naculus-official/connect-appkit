import type { StoryDefault, Story } from "@ladle/react"
import { SeedPhraseBackup } from "./SeedPhraseBackup"

const MOCK_SEED = "abandon ability able about above absent absorb abstract absurd abuse access accident account accuse achieve acid across act action actor actual adapt addict address adjust"

export default {
  title: "SeedPhraseBackup",
} satisfies StoryDefault

export const Default: Story = () => (
  <SeedPhraseBackup key="default"
    seedPhrase={MOCK_SEED}
    onConfirm={() => {}}
  />
)

export const Inline: Story = () => (
  <SeedPhraseBackup key="inline"
    seedPhrase={MOCK_SEED}
    onConfirm={() => {}}
    inline
  />
)

export const Modal: Story = () => (
  <SeedPhraseBackup key="modal"
    seedPhrase={MOCK_SEED}
    onConfirm={() => {}}
    open
    onOpenChange={() => {}}
  />
)

export const WithSkip: Story = () => (
  <SeedPhraseBackup key="with-skip"
    seedPhrase={MOCK_SEED}
    onConfirm={() => {}}
    onSkip={() => {}}
  />
)

export const TwelveWords: Story = () => {
  const twelveWords = MOCK_SEED.split(" ").slice(0, 12).join(" ")
  return (
    <SeedPhraseBackup key="twelve-words"
      seedPhrase={twelveWords}
      onConfirm={() => {}}
      wordCount={12}
    />
  )
}
