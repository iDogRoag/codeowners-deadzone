# Changed Files Example

## What This Shows

A tiny repo shape for trying changed-file analysis after initializing git locally.

## Command

```sh
codz changed examples/changed --base main --head HEAD
```

## Expected Top Findings

- Changed unowned files are reported once this folder is copied into a git repo and edited.

## Better CODEOWNERS

Add specific owners for the changed source paths instead of relying only on a fallback.
