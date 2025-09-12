# Create Gecko Release (local action)

This action posts release metadata to an endpoint to create a Gecko (Firefox) release.

Inputs

- `endpoint` (required) - Full URL of the endpoint to POST the release metadata to.
- `id` (required) - Extension id (e.g. `mediaharvest@vias.xpi`).
- `version` (required) - Semantic version (e.g. `1.2.0`).
- `url` (required) - Download URL for the XPI.
- `min-browser-version` (optional) - Semantic version string.
- `api-key` (required) - API key string sent as `x-api-key` header to authenticate the request.

Usage

Example workflow snippet:

```yaml
- uses: actions/checkout@v5
- uses: ./.github/actions/create-gecko-release
  with:
    endpoint: 'https://example.com/releases'
    id: 'mediaharvest@vias.xpi'
    version: '1.2.0'
    url: 'https://example.com/path/to/the.xpi'
    min-browser-version: '91.0.0'
    api-key: 'top-secret'
```

Build (local)

This repository includes the action source in TypeScript. Before using the action in workflows, ensure `dist/index.js` is built and committed. The repository contains a workflow `.github/workflows/build-create-gecko-release.yml` that runs on push to `main` and will build and commit `dist` automatically.

Manual build steps:

```bash
yarn install
yarn build
git add dist
git commit -m "chore(action): build create-gecko-release bundle"
git push
```

Notes

- The action bundles dependencies with `@vercel/ncc` into `dist/index.js` so the runtime doesn't need `node_modules` installed.
- The action uses `@actions/core` for input/output and `semver` for validation.
