# Dolmenwick

- Public notes live at repo root. `zReferee only/` stays local-only and ignored.
- Rebuild after note changes:
  - `cd .quartz`
  - `PATH=/opt/homebrew/opt/node@22/bin:$PATH QUARTZ_PREPARED_CONTENT_DIR="${TMPDIR:-/tmp}/dolmenwick-quartz-content" node scripts/prepare-content.mjs`
  - `PATH=/opt/homebrew/opt/node@22/bin:$PATH node quartz/bootstrap-cli.mjs build -d "${TMPDIR:-/tmp}/dolmenwick-quartz-content" -o public`
  - `PATH=/opt/homebrew/opt/node@22/bin:$PATH node scripts/copy-referee-tools.mjs`
  - `PATH=/opt/homebrew/opt/node@22/bin:$PATH node scripts/validate-output.mjs`
- Re-run tool tests:
  - `cd .referee-tools/party-generator`
  - `PATH=/opt/homebrew/opt/node@22/bin:$PATH npm test`
- After every `git push`, monitor the corresponding GitHub Actions deployment run for `Deploy Dolmenwick Pages` to completion and report the result before considering the push finished.
