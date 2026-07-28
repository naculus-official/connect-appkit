import type { Preview } from "@storybook/react";
import "../packages/ui/src/styles/tokens.css";
import React from "react";
import { Web3ComponentProvider } from "../packages/ui/src/contexts/ComponentRegistry";

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
  decorators: [
    (Story) => (
      <Web3ComponentProvider>
        <Story />
      </Web3ComponentProvider>
    ),
  ],
};

export default preview;
