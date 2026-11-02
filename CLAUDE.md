# CLAUDE.md

## Project

Media Harvest — a browser extension for downloading images and videos from X (Twitter).

Architecture follows **Domain-Driven Design**: `domain/`, `applicationUseCases/`,
`infra/`, with `contentScript/` and `serviceWorker/` as extension entry points.

## Guidelines

- **TDD**: write tests before or alongside implementation
- Keep domain logic free of infrastructure concerns
- Follow existing naming and file structure conventions
- Use `yarn` — not `npm` or `npx`
