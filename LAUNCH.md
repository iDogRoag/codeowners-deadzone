# Launch Checklist

Use this checklist before announcing CODEOWNERS Dead Zone Finder publicly.

- [ ] Create GitHub repo.
- [ ] Replace placeholder repo URLs.
- [ ] Publish npm package.
- [ ] Add repo topics.
- [ ] Record terminal demo GIF or screenshot.
- [ ] Post Show HN.
- [ ] Post to focused Reddit communities.
- [ ] Post to X, LinkedIn, Bluesky, and relevant Discords.
- [ ] Submit to developer launch sites.
- [ ] Ask maintainers to scan their repos and share surprising dead zones.

## Pre-Launch Verification

```sh
npm ci
npm test
npm run build
npm run typecheck
npm pack --dry-run
node dist/cli.js demo
node dist/cli.js scan examples/dead-zones
node dist/cli.js explain .github/workflows/release.yml examples/dead-zones
```

## Launch Notes

Keep the positioning honest: this is static offline CODEOWNERS coverage analysis. It does not verify GitHub users, team visibility, write access, branch protection, or required reviews.
