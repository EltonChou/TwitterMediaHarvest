import { defineConfig } from '@playwright/test'
import path from 'path'
import { defineBddConfig } from 'playwright-bdd'

defineBddConfig({
  features: 'e2e/features/**/*.feature',
  steps: ['e2e/steps/**/*.steps.ts', 'e2e/fixtures/chrome-extension.ts'],
  outputDir: 'bdd-gen',
})

export default defineConfig({
  testDir: path.resolve('bdd-gen'),
  testMatch: /.*\.spec\.js$/,
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { trace: 'on-first-retry' },
  projects: [
    {
      name: 'chrome-extension',
      use: { browserName: 'chromium' },
    },
  ],
})
