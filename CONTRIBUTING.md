# Contributing

Thanks for helping improve `codeowners-deadzone`.

## How to Install

Use Node 24 for local development.

```sh
nvm use
npm install
```

The package supports Node 22 and newer at runtime.

## How to Run Tests

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

For a quick manual smoke test:

```sh
node dist/cli.js demo
node dist/cli.js scan examples/dead-zones
```

## How CODEOWNERS Parsing Works

Parsing lives in `src/codeowners/parser.ts`.

The parser preserves raw lines, reports invalid syntax, accepts ownerless rules, and treats unsupported GitHub syntax like `!` negation and `[]` ranges as invalid. It does not verify whether owners exist or have write access.

## How Pattern Matching Works

Matching lives in `src/codeowners/pattern.ts` and `src/codeowners/matcher.ts`.

The matcher is case sensitive and follows the important CODEOWNERS rule that the last matching pattern wins. Add tests before changing matching behavior.

## How to Add a Dead Zone Finding

Findings are created in `src/codeowners/analyzer.ts`.

Good findings should include:

- a stable `id`
- severity: `high`, `medium`, or `low`
- evidence type: `confirmed`, `heuristic`, or `unverified-offline`
- a clear suggestion
- enough evidence for a maintainer to verify the issue

## How to Add a Fixture

Add small fixtures under `test/fixtures` for automated tests, or under `examples` for user-facing demos.

Keep fixtures minimal. Prefer one clear behavior per fixture unless the goal is a launch demo like `examples/dead-zones`.

## How to Add a Reporter

Reporters live in `src/reporters`.

Keep output deterministic, escape untrusted content in HTML, and include the static offline analysis caveat where relevant.

## How to Write a Good Finding Message

Good messages are specific and calm.

Prefer:

> `.github/workflows/release.yml` is explicitly unowned by line 6.

Avoid:

> Your repo is insecure.

This tool reports CODEOWNERS coverage gaps. It does not prove review protection or verify GitHub permissions.

## Pull Requests

Please include:

- a short summary of the change
- tests for behavior changes
- docs updates for new flags, report fields, or examples
