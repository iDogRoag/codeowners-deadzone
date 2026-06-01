# Configuration

`codeowners-deadzone` looks for config files in this order:

1. `codeowners-deadzone.yml`
2. `codeowners-deadzone.yaml`
3. `.codeowners-deadzone.yml`
4. `.codeowners-deadzone.yaml`

Example:

```yaml
version: 1
minCoverage: 95
failOn:
  - high
  - coverage-below
include:
  - "**/*"
exclude:
  - "node_modules/**"
  - "dist/**"
  - "coverage/**"
  - ".git/**"
risk:
  importantPaths:
    - ".github/workflows/**"
    - "infra/**"
    - "services/billing/**"
  lowRiskPaths:
    - "fixtures/**"
trustedOwners:
  - "@my-org/platform"
  - "@my-org/security"
ownerLimits:
  maxFilesPerOwnerPercent: 60
  maxUnownedFiles: 0
  maxExplicitlyUnownedFiles: 0
suggestions:
  enabled: true
  maxRules: 20
  preferredOwners:
    - "@my-org/platform"
changed:
  base: origin/main
  head: HEAD
```

CLI flags override config values where applicable.
