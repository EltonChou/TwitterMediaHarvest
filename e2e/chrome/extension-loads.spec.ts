import { expect, test } from '../fixtures/chrome-extension'

test('service worker registers and extension ID is valid', async ({
  extensionId,
}) => {
  expect(extensionId).toMatch(/^[a-z]{32}$/)
})

test('popup loads without JS errors', async ({ context, extensionId }) => {
  const errors: Error[] = []
  const page = await context.newPage()
  page.on('pageerror', err => errors.push(err))

  await page.goto(`chrome-extension://${extensionId}/index.html`)
  await page.waitForSelector('#root')

  expect(errors).toHaveLength(0)
})
