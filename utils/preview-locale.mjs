#!/usr/bin/env node
/*
 * Open the built Chrome extension in a given UI locale for checking
 * localized design, without changing the system/browser language.
 *
 * Usage: yarn preview:locale <locale>   e.g. ja, zh_TW, pt_BR
 */
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const EXTENSION_PATH = path.resolve('build/chrome')
const LOCALES_PATH = path.join(EXTENSION_PATH, '_locales')

if (!fs.existsSync(LOCALES_PATH)) {
  console.error('Build not found. Run "yarn build:chrome:all:dev" first.')
  process.exit(1)
}

const locales = fs.readdirSync(LOCALES_PATH)
const locale = process.argv[2]

if (!locales.includes(locale)) {
  console.error(`Usage: yarn preview:locale <${locales.join('|')}>`)
  process.exit(1)
}

// Chrome expects BCP 47 tags (zh-TW), _locales uses underscores (zh_TW).
const lang = locale.replace('_', '-')

const context = await chromium.launchPersistentContext('', {
  headless: false,
  locale: lang,
  args: [
    `--lang=${lang}`,
    `--disable-extensions-except=${EXTENSION_PATH}`,
    `--load-extension=${EXTENSION_PATH}`,
  ],
})

const worker =
  context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'))
const extensionId = worker.url().split('/')[2]
const base = `chrome-extension://${extensionId}/index.html`

const options = await context.newPage()
await options.goto(base)
const popup = await context.newPage()
await popup.setViewportSize({ width: 400, height: 600 })
await popup.goto(`${base}?tab=popup`)

console.log(
  `UI language: ${await popup.evaluate(() => chrome.i18n.getUILanguage())}`
)
console.log('Close the browser window to exit.')
