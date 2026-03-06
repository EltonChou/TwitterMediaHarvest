# CLAUDE.md

## Project

Media Harvest — a browser extension for downloading images and videos from X (Twitter).

## Architecture

This project follows **Domain-Driven Design (DDD)**:

- `domain/` — entities, value objects, domain services, repository interfaces
- `applicationUseCases/` — application layer, orchestrates domain logic
- `infra/` — infrastructure implementations (repositories, external services)
- `contentScript/` / `serviceWorker/` — browser extension entry points

## Common Scripts

```sh
# Testing
yarn test                  # typecheck + unit tests (with coverage)
yarn test:all              # run tests across all workspaces

# Building
yarn build:all             # production build for all browsers
yarn build:chrome:all:dev  # development build for Chrome
yarn build:firefox:all:dev # development build for Firefox
yarn build:tools           # build internal workspace packages

# Watch
yarn watch:chrome:all:dev  # watch mode for Chrome

# Checks (run before committing)
yarn check:all             # env, locales, changelog, translations, flags, typecheck
yarn check:envfile         # verify .env file
yarn check:translations    # verify translation completeness
yarn check:changelog       # verify changelog
yarn check:flags           # verify feature flags
yarn typecheck             # TypeScript type check only
yarn lint                  # ESLint + Prettier fix

# Locales / i18n
yarn locale:extract        # extract i18n strings from source
yarn locale:check          # extract + verify locale files
yarn locale:update-translations  # update translation files
yarn locale:sync-version   # sync pot version + update translations
```

## Guidelines

- **TDD**: write tests before or alongside implementation
- Keep domain logic free of infrastructure concerns
- Follow existing naming and file structure conventions
- Use `yarn` — not `npm` or `npx`
