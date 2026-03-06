# Contributing

## Prerequisites

- Node.js >= 22
- [Yarn](https://yarnpkg.com/) (this project uses Yarn workspaces)

## Setup

Install dependencies:

```sh
yarn install
```

Copy the sample environment file and fill in the required values:

```sh
cp sample.env .env
```

## Building

Build everything (all browsers, production):

```sh
yarn build:all
```

Build for a specific browser in development mode:

```sh
yarn build:chrome:all:dev
yarn build:edge:all:dev
yarn build:firefox:all:dev
```

Watch mode (Chrome):

```sh
yarn watch:chrome:all:dev
```

Output is placed under `dist/` and `build/`.

## Testing

```sh
yarn test        # typecheck + unit tests
yarn test:all    # run tests across all workspaces
```

## Linting

```sh
yarn lint
```

## Type checking

```sh
yarn typecheck
```
