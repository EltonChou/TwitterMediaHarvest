# locales

Translation files for Media Harvest, using the [gettext](https://www.gnu.org/software/gettext/) `.po` format.

## Files

| File                  | Description                                                        |
| --------------------- | ------------------------------------------------------------------ |
| `template.pot`        | Master template — generated from source code, do not edit manually |
| `template.pot.digest` | SHA-256 digest of the template content, used to detect changes     |
| `<locale>.po`         | Translation file for a specific locale (e.g. `zh_TW.po`, `ja.po`)  |

## Workflow

### 1. Extract strings from source

Scans source files for i18n call expressions and updates `template.pot` if the content has changed (compared against `template.pot.digest`).

```sh
yarn locale:extract
```

Use `--check` to verify without writing (exits with code `1` if the template is out of date):

```sh
yarn locale:extract --check
```

### 2. Sync `.po` files with the template

Merges the updated template into all `.po` files — adding new keys, removing obsolete ones, and preserving existing translations.

```sh
yarn locale:update-translations
```

### 3. Check locale completeness

Diffs each `.po` file against the template and reports missing or extra contexts/msgIds.

```sh
yarn locale:check
```

### Sync version + update in one step

```sh
yarn locale:sync-version
```

## How the digest works

`template.pot.digest` stores the SHA-256 hash of the generated template content. On the next `locale:extract` run, the new hash is compared against the stored one:

- **Same** — template is up to date, no file is written.
- **Different** — `template.pot` and `template.pot.digest` are both updated.

This avoids unnecessary file changes (e.g. timestamp-only diffs) on every run.

## Adding a new locale

1. Copy an existing `.po` file and rename it to `<locale>.po`.
2. Update the headers inside the file.
3. Translate the `msgstr` fields.
4. Run `yarn locale:check` to verify completeness.
