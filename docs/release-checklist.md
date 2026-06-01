# Release Checklist

- [ ] Run `npm ci`.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm pack --dry-run`.
- [ ] Run `codeowners-deadzone demo`.
- [ ] Run `codz scan examples/dead-zones`.
- [ ] Run `codz explain .github/workflows/release.yml examples/dead-zones`.
- [ ] Update `CHANGELOG.md`.
- [ ] Tag release.
- [ ] Publish npm package.
- [ ] Create GitHub release.
- [ ] Post launch links.
