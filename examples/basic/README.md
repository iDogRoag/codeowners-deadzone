# Basic Example

## What This Shows

A small repo with a broad fallback, source ownership, and docs ownership.

## Command

```sh
codz scan examples/basic
```

## Expected Top Findings

- Broad fallback owns a few files.
- No trusted owner is configured unless you provide one.

## Better CODEOWNERS

Keep the fallback, but add explicit owners for package metadata and the active CODEOWNERS file.
