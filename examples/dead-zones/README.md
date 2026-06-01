# Dead Zones Example

## What This Shows

A launch demo repo with ownerless rules, invalid patterns, shadowed rules, ignored CODEOWNERS files, fallback ownership, and important paths without specific ownership.

## Command

```sh
codz scan examples/dead-zones
```

## Expected Top Findings

- `.github/workflows` is explicitly unowned.
- The active CODEOWNERS file is explicitly unowned.
- `apps/billing` is explicitly unowned.
- A rule is fully shadowed.
- `CODEOWNERS` and `docs/CODEOWNERS` are ignored by GitHub.
- Unsupported `!` and `[]` patterns are skipped.

## Better CODEOWNERS

Add specific owners for workflows, billing, infrastructure, and the active CODEOWNERS file. Remove ignored lower-priority CODEOWNERS files or merge their rules into `.github/CODEOWNERS`.
