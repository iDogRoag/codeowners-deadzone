# 60 Second Demo Script

## 0-10 seconds

Run the bundled demo:

```sh
codeowners-deadzone demo
```

Say: "This scans a fake repo with real CODEOWNERS failure modes: ownerless rules, ignored files, invalid patterns, and broad fallback ownership."

## 10-25 seconds

Run the risky example directly:

```sh
codz scan examples/dead-zones
```

Point out the top findings: `.github/workflows` is unowned, the active CODEOWNERS file is unowned, billing is ownerless, and lower-priority CODEOWNERS files are ignored.

## 25-40 seconds

Explain one file:

```sh
codz explain .github/workflows/release.yml examples/dead-zones
```

Say: "Reading CODEOWNERS is not enough because the last matching rule wins, and ownerless rules can clear ownership."

## 40-50 seconds

If you copied `examples/changed` into a git repo, run:

```sh
codz changed examples/changed
```

Say: "Changed mode focuses a pull request on the files that matter now."

## 50-60 seconds

Create and open an HTML report:

```sh
codz demo --format html --output codeowners-deadzone-demo.html
```

Say: "It is offline static analysis, not a GitHub permissions verifier. It helps teams review CODEOWNERS coverage gaps before they become review gaps."
