# CODEOWNERS Dead Zone Finder

`codeowners-deadzone` finds weak, missing, or misleading CODEOWNERS ownership coverage in a repository.

It answers one practical question:

> Find CODEOWNERS blind spots before they reach your pull requests.

The CLI works offline by default. It does not call AI services, GitHub APIs, telemetry endpoints, or any network service unless a future explicit online mode is added.

## Install

```sh
npm install --save-dev codeowners-deadzone
```

Or run without installing:

```sh
npx codeowners-deadzone scan .
```

The package exposes two binaries:

- `codeowners-deadzone`
- `codz`

`codz` is only the short CLI alias. The repository and package name are `codeowners-deadzone`.

## Usage

```sh
codz scan
codz scan . --format markdown --output codeowners-deadzone-report.md
codz scan --format sarif --output codeowners-deadzone.sarif
codz scan --fail-on high
codz scan --fail-on coverage-below --min-coverage 95
codz scan --write-baseline codeowners-deadzone-baseline.json
codz scan --baseline codeowners-deadzone-baseline.json --fail-on-new high
codz scan --strict
codz explain src/app.ts
codz changed --base origin/main --head HEAD --format markdown
codz init
```

## What It Checks

Confirmed findings include:

- no active CODEOWNERS file
- active CODEOWNERS over GitHub's 3 MB limit
- ignored duplicate CODEOWNERS files
- invalid CODEOWNERS lines skipped by GitHub
- unowned files
- ownerless rules that explicitly clear ownership
- unused rules
- fully shadowed rules
- case-sensitive pattern mismatches that leave files unowned

Heuristic findings include:

- broad fallback owners hiding missing specific ownership
- one owner owning too much of the repository
- important folders with weak specific ownership

Offline-unverified findings include:

- owner existence
- team visibility
- write access
- whether branch protection or rulesets require CODEOWNERS review

This tool reports CODEOWNERS ownership coverage. It does not claim that files are protected from merge unless repository protection settings are verified separately.

By default, low-severity or offline-unverified findings do not change a run from `pass` to `warn`. Use `--strict` if you want any finding to produce warning status.

## GitHub CODEOWNERS Semantics

The active CODEOWNERS file is discovered in GitHub order:

1. `.github/CODEOWNERS`
2. `CODEOWNERS`
3. `docs/CODEOWNERS`

If more than one exists, only the first is active and lower-priority files are reported as ignored.

Matching is case sensitive, even on macOS and Windows. The last matching rule wins. Ownerless rules are treated as explicit unowned zones.

## CI Example

```yaml
name: CODEOWNERS Dead Zone Finder

on:
  pull_request:
  push:
    branches:
      - main

permissions:
  contents: read

jobs:
  codeowners-deadzone:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      - run: npx codeowners-deadzone scan . --ci --format markdown --output codeowners-deadzone-report.md --fail-on high
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: codeowners-deadzone-report
          path: codeowners-deadzone-report.md
```

For gradual adoption:

```sh
codz scan --write-baseline codeowners-deadzone-baseline.json
codz scan --baseline codeowners-deadzone-baseline.json --fail-on-new high
```

## Reports

Supported formats:

- `table`
- `json`
- `markdown`
- `html`
- `sarif`

SARIF output is suitable for GitHub code scanning upload workflows.

## Development

Use Node 24 LTS for local development. The package supports Node 22 and newer at runtime so teams on the previous LTS line can still adopt it.

```sh
nvm use
npm install
npm test
npm run typecheck
npm run lint
npm run build
```

## License

MIT
