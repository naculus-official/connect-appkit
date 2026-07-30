import { defineConfig } from 'vitest/config'
import path from "path"
import { getAliases } from './test-utils/aliases'

const root = __dirname
const wcDist = path.join(root, "packages/wc/dist")

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@naculus\/connect-appkit-wc\/dist\/(.*)/, replacement: `${wcDist}/$1` },
      ...Object.entries(getAliases(root)).map(([find, replacement]) => ({ find, replacement: replacement as string })),
    ],
    conditions: ['import', 'node'],
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/**/*.test.ts', 'packages/**/*.test.tsx'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/out/**', '**/coverage/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/*.test.ts', '**/*.test.tsx', '**/node_modules/**', '**/dist/**'],
    },
  },
})
