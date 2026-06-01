# Security Model

`codeowners-deadzone` is offline by default.

It does not:

- call AI services
- call GitHub APIs
- send telemetry
- require a GitHub token
- mutate repository files unless `init` or `--output`/`--write-baseline` is used

It may:

- read repository files
- run `git ls-files`
- run `git diff --name-only`
- run `git show` in changed mode to read CODEOWNERS from the base ref
- write report output when requested

Static limits:

- owner existence is not verified
- team visibility is not verified
- owner write access is not verified
- branch protection and rulesets are not verified

Reports should describe CODEOWNERS ownership coverage, not guaranteed merge protection.
