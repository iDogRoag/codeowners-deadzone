# Shadowed Rules Example

## What This Shows

A later rule fully overrides an earlier rule with the same pattern.

## Command

```sh
codz scan examples/shadowed
```

## Expected Top Findings

- One rule is fully shadowed.

## Better CODEOWNERS

Remove the stale rule or make the two patterns distinct enough that both can win for their intended files.
