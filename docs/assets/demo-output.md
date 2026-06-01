# CODEOWNERS Dead Zone Report

| Field | Value |
| --- | --- |
| Status | warn |
| Active CODEOWNERS | .github/CODEOWNERS |
| Files scanned | 12 |
| Coverage | 58.3% |
| Weighted coverage | 51.4% |
| Findings | 15 |

## Ignored CODEOWNERS Files

- CODEOWNERS
- docs/CODEOWNERS

## Dead Zones

| Severity | Evidence | Finding | Location | Suggestion |
| --- | --- | --- | --- | --- |
| high | confirmed | CODEOWNERS file itself is unowned | .github/CODEOWNERS | Add a trusted owner for the active CODEOWNERS file. |
| high | confirmed | Ownerless rule clears important path | .github/CODEOWNERS | Confirm the clear is intentional or add owners to the final matching rule. |
| high | confirmed | Ownerless rule clears important path | .github/workflows/ci.yml | Confirm the clear is intentional or add owners to the final matching rule. |
| high | confirmed | Ownerless rule clears important path | .github/workflows/release.yml | Confirm the clear is intentional or add owners to the final matching rule. |
| high | confirmed | Ownerless rule clears important path | apps/billing/index.ts | Confirm the clear is intentional or add owners to the final matching rule. |
| high | confirmed | Ownerless rule clears important path | apps/billing/payments.ts | Confirm the clear is intentional or add owners to the final matching rule. |
| medium | confirmed | Ignored CODEOWNERS file | CODEOWNERS | Delete the ignored file or merge its rules into the active CODEOWNERS file. |
| medium | confirmed | Ignored CODEOWNERS file | docs/CODEOWNERS | Delete the ignored file or merge its rules into the active CODEOWNERS file. |
| medium | confirmed | Invalid CODEOWNERS line skipped | .github/CODEOWNERS | Fix the syntax so GitHub can apply the intended rule. |
| medium | confirmed | Invalid CODEOWNERS line skipped | .github/CODEOWNERS | Fix the syntax so GitHub can apply the intended rule. |
| medium | confirmed | Coverage below configured minimum |  | Add or repair CODEOWNERS rules for unowned areas. |
| medium | heuristic | Ownership is concentrated |  | Split ownership across more specific teams where appropriate. |
| medium | confirmed | Rule is fully shadowed | line 5 | Remove the rule or move it below the rules that should not override it. |
| low | unverified-offline | No trusted owner configured |  | Configure trustedOwners for stricter governance checks. |
| low | heuristic | Broad fallback owns files |  | Confirm this is intentional and add specific rules for important areas. |

## Important Unowned Files

- .github/CODEOWNERS (explicitly-unowned)
- .github/workflows/ci.yml (explicitly-unowned)
- .github/workflows/release.yml (explicitly-unowned)
- apps/billing/index.ts (explicitly-unowned)
- apps/billing/payments.ts (explicitly-unowned)

## Suggested CODEOWNERS Additions

```CODEOWNERS
/.github/workflows/ @TODO-owner
/apps/billing/ @TODO-owner
/.github/ @TODO-owner
```

Suggestions use placeholders unless preferred owners are configured. Review them before committing.

_Static offline analysis. Owner existence, team visibility, write access, and branch protection are not verified._
