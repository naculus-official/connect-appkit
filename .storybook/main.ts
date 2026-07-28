import type { StorybookConfig } from "@storybook/react-vite";
import { getAliases } from "../test-utils/aliases";

const config: StorybookConfig = {
  stories: [
    "../packages/ui/src/components/**/*.stories.@(ts|tsx)",
    "../packages/react/src/**/*.stories.@(ts|tsx)",
  ],
  addons: [],
  framework: { name: "@storybook/react-vite", options: {} },
  viteFinal: (config) => ({
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...(config.resolve?.alias as Record<string, string>),
        ...getAliases(process.cwd()),
        "@": `${process.cwd()}/packages/ui/src`,
      },
    },
    define: { ...config.define, "process.env": "{}" },
    optimizeDeps: {
      include: [
        "react", "react-dom", "react/jsx-dev-runtime",
        "class-variance-authority", "clsx", "tailwind-merge",
        "@radix-ui/react-slot", "@radix-ui/react-dialog",
        "@radix-ui/react-switch", "@radix-ui/react-checkbox",
        "@radix-ui/react-tabs", "@radix-ui/react-tooltip",
        "@radix-ui/react-progress", "@radix-ui/react-avatar",
        "@radix-ui/react-label", "@radix-ui/react-dropdown-menu",
        "@radix-ui/react-scroll-area", "@radix-ui/react-popover",
        "@radix-ui/react-separator", "@radix-ui/react-select",
        "lucide-react", "qrcode",
      ],
    },
    ssr: { noExternal: ["react", "react-dom"] },
  }),
};

export default config;
