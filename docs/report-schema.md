# Report Schema

JSON reports use `schemaVersion: 1`.

Top-level fields:

- `status`: `pass`, `warn`, or `fail`
- `repo`: repository metadata
- `codeowners`: active and ignored CODEOWNERS files
- `summary`: coverage and rule metrics
- `owners`: owner concentration data
- `rules`: rule match and shadowing data
- `files`: file-level ownership details
- `findings`: dead-zone findings
- `suggestions`: suggested CODEOWNERS additions
- `warnings`: parser and mode warnings

Findings include:

- `severity`: `high`, `medium`, or `low`
- `evidenceType`: `confirmed`, `heuristic`, or `unverified-offline`
- `category`: `coverage`, `rules`, `codeowners`, `ownership`, `syntax`, or `config`

SARIF reports follow SARIF 2.1.0 and map high severity to `error`, medium to `warning`, and low to `note`.

By default, low-severity and offline-unverified findings can appear while the overall status remains `pass`. Use `--strict` to make any finding produce `warn` status.
