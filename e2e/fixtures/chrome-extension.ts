import { BrowserContext, Page, chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { test as base, createBdd } from 'playwright-bdd'

const EXTENSION_PATH = path.resolve('build/chrome')
const MANIFEST_PATH = path.join(EXTENSION_PATH, 'manifest.json')

export const test = base.extend<{
  context: BrowserContext
  extensionId: string
  popupPage: Page
  pageErrors: Error[]
}>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, provide) => {
    if (!fs.existsSync(MANIFEST_PATH)) {
      throw new Error(
        `Extension build not found at ${MANIFEST_PATH}.\n` +
          'Run "yarn build:chrome:all:dev" before running e2e tests.'
      )
    }

    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        '--headless=new',
        '--no-sandbox',
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
      ],
    })

    await provide(context)
    await context.close()
  },

  extensionId: async ({ context }, provide) => {
    let serviceWorker = context.serviceWorkers()[0]
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker')
    }

    const extensionId = serviceWorker.url().split('/')[2]
    await provide(extensionId)
  },

  // eslint-disable-next-line no-empty-pattern
  pageErrors: async ({}, provide) => {
    await provide([])
  },

  popupPage: async ({ context, extensionId, pageErrors }, provide) => {
    const page = await context.newPage()
    page.on('pageerror', err => pageErrors.push(err))
    await page.goto(`chrome-extension://${extensionId}/index.html`)
    await provide(page)
  },
})

export const expect = test.expect
export const { Given, When, Then } = createBdd(test)
