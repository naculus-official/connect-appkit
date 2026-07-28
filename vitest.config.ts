import { defineConfig } from 'vitest/config'
import { getAliases } from './test-utils/aliases'

export default defineConfig({
  resolve: {
    alias: getAliases(__dirname),
    conditions: ['import', 'node'],
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/ui/**/*.test.ts', 'packages/ui/**/*.test.tsx'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/out/**', '**/coverage/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/*.test.ts', '**/*.test.tsx', '**/node_modules/**', '**/dist/**'],
    },
  },
})
