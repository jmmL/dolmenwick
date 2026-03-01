# Dolmenwick

This repository publishes the player-facing Dolmenwood campaign notes to GitHub Pages with Quartz while keeping referee-only notes local in iCloud.

## Layout

- Vault content lives at the repository root.
- `zReferee only/` stays local-only and is ignored by Git.
- `.quartz/` contains the vendored Quartz site and build scripts.
- `.referee-tools/party-generator/` preserves the original static party generator.

## Publishing Flow

1. Edit notes in Obsidian from the iCloud-backed vault.
2. Commit and push only player-facing changes.
3. GitHub Actions prepares Quartz content, runs the party-generator tests, builds the static site, and deploys to GitHub Pages.

## Local Preview

Quartz:

```bash
cd .quartz
npm ci
QUARTZ_PREPARED_CONTENT_DIR="${TMPDIR:-/tmp}/dolmenwick-quartz-content" node scripts/prepare-content.mjs
QUARTZ_PREPARED_CONTENT_DIR="${TMPDIR:-/tmp}/dolmenwick-quartz-content" npx quartz build --directory "${TMPDIR:-/tmp}/dolmenwick-quartz-content" --output public --serve
```

Party generator tests:

```bash
cd .referee-tools/party-generator
npm ci
npx playwright install chromium
npm test
```
