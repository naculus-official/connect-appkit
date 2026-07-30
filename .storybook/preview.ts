import type { Preview } from "@storybook/react";
import "../packages/ui/src/styles/tokens.css";
import "../packages/wc/dist/components/index.js";

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
};

export default preview;
