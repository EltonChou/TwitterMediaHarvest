# E2E Tests (Playwright)

End-to-end tests that load the built Chrome extension into a real browser.

## Prerequisites

The Chrome extension must be built before running tests:

```sh
yarn build:chrome:all:dev
```

## Running tests

```sh
# Run all e2e tests
yarn test:e2e

# Run Chrome-specific tests only
yarn test:e2e:chrome

# Open Playwright UI mode
yarn test:e2e:ui
```

## Firefox

Firefox e2e tests are not implemented. Playwright has no stable API for loading unpacked Firefox MV3 extensions (tracked upstream). This can be added once Playwright provides official support.

## Test results

- HTML report: `playwright-report/`
- Traces / videos: `test-results/`
