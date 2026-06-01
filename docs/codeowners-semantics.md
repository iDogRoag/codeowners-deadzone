# CODEOWNERS Semantics

The active CODEOWNERS file is selected in GitHub order:

1. `.github/CODEOWNERS`
2. `CODEOWNERS`
3. `docs/CODEOWNERS`

Only the first existing file is active.

Implemented behavior:

- matching is case sensitive
- the last matching pattern wins
- ownerless rules are valid and clear ownership
- files over 3 MB are reported because GitHub does not load them
- invalid lines are reported and skipped
- `!` negation is unsupported
- `[]` character ranges are unsupported
- escaping a leading `#` does not create a pattern

Pattern support:

- `*` matches within one path segment
- `**` matches across directories
- `/docs/` matches the root docs directory recursively
- `docs/*` matches one level under docs
- `*.js` matches JavaScript files anywhere

The matcher is intentionally tested directly instead of relying blindly on a generic glob library.
