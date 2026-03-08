import { Given, Then, When, expect } from '../fixtures/chrome-extension'

Given('the Chrome extension is loaded', async () => {
  // Browser launch and extension loading are handled by fixtures
})

Then(
  'the extension ID should be a valid Chrome extension identifier',
  async ({ extensionId }) => {
    expect(extensionId).toMatch(/^[a-z]{32}$/)
  }
)

When('I open the extension popup', async ({ popupPage: _ }) => {
  // Navigating to the popup is handled by the popupPage fixture
})

Then(
  'there should be no JavaScript errors on the page',
  async ({ pageErrors }) => {
    expect(pageErrors).toHaveLength(0)
  }
)

Then('the React root element should be present', async ({ popupPage }) => {
  await popupPage.waitForSelector('#root')
})
