# CLAUDE.md

## Project

Media Harvest — a browser extension for downloading images and videos from X (Twitter).

Architecture follows **Domain-Driven Design**: `domain/`, `applicationUseCases/`,
`infra/`, with `contentScript/` and `serviceWorker/` as extension entry points.

## Guidelines

- Keep domain logic free of infrastructure concerns
- Follow existing naming and file structure conventions
- Use `yarn` — not `npm` or `npx`

### Testing

- **TDD**: write tests before or alongside implementation
- **Multiple test cases**: use `it.each` / `test.each` (one named row per case),
  not an array of cases packed into a single test
