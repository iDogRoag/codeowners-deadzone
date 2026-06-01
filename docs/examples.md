# Examples

## Scan

```sh
codz scan .
```

## Markdown PR Report

```sh
codz scan --format markdown --output codeowners-deadzone-report.md
```

## SARIF

```sh
codz scan --format sarif --output codeowners-deadzone.sarif
```

## Explain a File

```sh
codz explain src/app.ts
```

## Changed Files

```sh
codz changed --base origin/main --head HEAD --format markdown
```

Changed mode reads CODEOWNERS from the base ref when available, matching pull request review behavior more closely.

## Baseline Adoption

```sh
codz scan --write-baseline codeowners-deadzone-baseline.json
codz scan --baseline codeowners-deadzone-baseline.json --fail-on-new high
```

## Strict Status

```sh
codz scan --strict
```

By default, low-severity or offline-unverified findings do not change a result from `pass` to `warn`. `--strict` makes any finding produce warning status unless a selected fail policy turns it into `fail`.
