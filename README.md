# CODEOWNERS Dead Zone Finder

Find the files and folders your CODEOWNERS rules do not actually protect.

CODEOWNERS Dead Zone Finder scans your repo using GitHub-like last-match-wins behavior and shows unowned files, ownerless rules, shadowed patterns, invalid lines, ignored CODEOWNERS files, and ownership concentration.
It helps teams see where review ownership silently falls through the cracks.

```sh
npx codeowners-deadzone scan .
```

```sh
npx codeowners-deadzone demo
```

```text
CODEOWNERS Dead Zone Finder

Coverage 72 percent
Weighted coverage 58 percent
Files scanned 184
Unowned files 51
Explicitly unowned files 6
Shadowed rules 3
Invalid lines 2
High findings 4

Top dead zones

.github/workflows is unowned
CODEOWNERS file is unowned
apps/billing has no specific owner
Rule on line 8 is fully shadowed
docs/CODEOWNERS exists but is ignored by GitHub

Suggested additions

/.github/workflows/ @TODO-owner
/apps/billing/ @TODO-owner
/CODEOWNERS @TODO-owner
```

HTML demo:

```sh
npx codeowners-deadzone demo --format html --output codeowners-deadzone-demo.html
```

Terminal GIF coming soon.
Run `npx codeowners-deadzone demo` to see the same output locally.

Demo assets:

- [Terminal output](docs/assets/demo-output.txt)
- [Markdown report](docs/assets/demo-output.md)
- [HTML report](docs/assets/demo-report.html)

## What is CODEOWNERS Dead Zone Finder

`codeowners-deadzone` is a static offline CODEOWNERS coverage analyzer.

It scans a repository, applies GitHub-like CODEOWNERS matching, and reports unowned files, shadowed rules, invalid patterns, ignored CODEOWNERS files, and risky ownership gaps.

It is not a full access-control verifier. It does not call the GitHub API by default, verify GitHub users or teams, check team visibility, check write access, or prove that reviews are enforced.

The package exposes two binaries:

- `codeowners-deadzone`
- `codz`

`codz` is only the short CLI alias. The repository and package name are `codeowners-deadzone`.

## Why this exists

CODEOWNERS files can look correct while important files are still unowned.

Common failure modes include:

- a later rule silently overriding an earlier owner
- ownerless rules clearing ownership
- `.github/CODEOWNERS` causing root `CODEOWNERS` or `docs/CODEOWNERS` to be ignored
- invalid syntax being skipped by GitHub
- a broad fallback hiding missing specific ownership

## Quickstart

```sh
npx codeowners-deadzone scan .
```

For a local install:

```sh
npm install --save-dev codeowners-deadzone
npx codz scan .
```

## Demo

Try the bundled demo before scanning your own repo:

```sh
npx codeowners-deadzone demo
npx codeowners-deadzone demo --format markdown
npx codeowners-deadzone demo --format json
npx codeowners-deadzone demo --format html --output codeowners-deadzone-demo.html
npx codeowners-deadzone demo --badge
```

## Example output

```sh
codz scan examples/dead-zones
```

The demo reports ownerless workflows, an ownerless active CODEOWNERS file, ignored lower-priority CODEOWNERS files, invalid patterns, and a fully shadowed rule.

## What counts as a dead zone

Dead zones include:

- no active CODEOWNERS file
- CODEOWNERS over GitHub's 3 MB limit
- files with no owner
- files explicitly cleared by ownerless rules
- invalid CODEOWNERS lines skipped by GitHub
- rules that match zero files
- rules that are fully shadowed
- broad fallback owners hiding missing specific ownership
- ownership concentrated in one person or team
- ignored duplicate CODEOWNERS files

Findings are labeled as `confirmed`, `heuristic`, or `unverified-offline`.

## How CODEOWNERS matching works

GitHub looks for CODEOWNERS in this order:

1. `.github/CODEOWNERS`
2. `CODEOWNERS`
3. `docs/CODEOWNERS`

Only the first existing file is active. CODEOWNERS matching is case sensitive, and the last matching rule wins.

Unsupported GitHub CODEOWNERS syntax such as `!` negation and `[]` ranges is reported as invalid and skipped.

## Scan mode

```sh
codz scan .
codz scan . --format markdown --output codeowners-deadzone-report.md
codz scan . --format sarif --output codeowners-deadzone.sarif
codz scan . --fail-on high
codz scan . --fail-on coverage-below --min-coverage 95
codz scan . --show-files
codz scan . --show-rules
```

## Explain mode

```sh
codz explain .github/workflows/release.yml examples/dead-zones
```

Explain mode shows the final matching rule, all matching rules in order, and why last-match-wins selected the final owner.

## Changed files mode

```sh
codz changed --base origin/main --head HEAD
```

Changed mode analyzes only files changed between two refs while still parsing the CODEOWNERS file from the base ref when available.

## GitHub Actions usage

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

## Install

```sh
npm install --save-dev codeowners-deadzone
```

Use Node 24 LTS for local development. The package supports Node 22 and newer at runtime.

## Configuration

Generate a starter config:

```sh
codz init
```

Config files are loaded in this order:

1. `codeowners-deadzone.yml`
2. `codeowners-deadzone.yaml`
3. `.codeowners-deadzone.yml`
4. `.codeowners-deadzone.yaml`

See [configuration docs](docs/configuration.md).

## Report formats

Supported formats:

- `table`
- `markdown`
- `json`
- `html`
- `sarif`

CODEOWNERS Dead Zone Finder can print badge Markdown, but it does not host badges in v1.

```sh
codz scan . --badge
```

## Coverage score

Coverage is the percentage of included files whose final matching CODEOWNERS rule has at least one owner.

Weighted coverage gives important paths more influence, including CODEOWNERS files, GitHub workflows, source, package manifests, infrastructure, security, billing, and migration paths.

## Security model

The CLI is offline by default.

It does not call AI services, GitHub APIs, telemetry endpoints, or any network service by default.

Owner existence, team visibility, write access, branch protection, and required review enforcement are not verified.

See [security model](docs/security-model.md).

## Limitations

- Static analysis cannot prove GitHub review enforcement.
- Offline mode cannot verify owners or permissions.
- Heuristic findings need human review.
- CODEOWNERS matching is implemented and tested directly, but edge cases should continue to be expanded from GitHub documentation.

## Roadmap

- Optional GitHub API verification for owner existence and write access
- Richer SARIF annotations
- PR comment mode
- GitHub App
- Organization-wide scan
- Ownership heatmap
- Monorepo package ownership matrix
- Baseline comparison
- Hosted badge service
- VS Code extension
- CODEOWNERS autofix suggestions

## Contributing

Good first contributions:

- Add more CODEOWNERS pattern tests.
- Improve suggested owner grouping.
- Add monorepo examples.
- Improve changed files mode.
- Improve HTML report formatting.
- Add docs examples from real repos.

See [CONTRIBUTING.md](CONTRIBUTING.md) and [good first issue ideas](docs/good-first-issues.md).

## License

MIT
