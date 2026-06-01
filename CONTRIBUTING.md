# Contributing

Thanks for helping improve `codeowners-deadzone`.

## Local Setup

```sh
npm install
npm test
npm run typecheck
npm run build
```

## Guidelines

- Keep analysis deterministic and offline by default.
- Add tests for CODEOWNERS matching behavior before changing matcher logic.
- Do not add telemetry or default network calls.
- Be explicit when a finding is confirmed, heuristic, or unverified offline.

## Pull Requests

Please include:

- a short summary of the change
- tests for behavior changes
- any docs updates needed for new flags or report fields
