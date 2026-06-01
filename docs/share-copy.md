# Launch Copy

## Show HN Title

Show HN: CODEOWNERS Dead Zone Finder, a coverage checker for repo ownership

## Show HN Post Body

I built CODEOWNERS Dead Zone Finder because CODEOWNERS files can look correct while important files are still unowned.

It scans a repo with GitHub like last match wins behavior and reports unowned files, ownerless rules, shadowed patterns, invalid lines, ignored CODEOWNERS files, and risky ownership gaps.

It runs offline and does not call the GitHub API.

## Reddit Post

I made a small OSS CLI for auditing CODEOWNERS coverage.

`codeowners-deadzone` scans a repository offline and reports unowned files, ownerless rules, fully shadowed patterns, invalid lines, ignored CODEOWNERS files, and broad fallback ownership. It does not verify GitHub permissions or branch protection; it is static coverage analysis for CODEOWNERS.

Try it:

```sh
npx codeowners-deadzone demo
npx codeowners-deadzone scan .
```

## X Post

CODEOWNERS files can look right while important files are still unowned.

I built CODEOWNERS Dead Zone Finder: an offline CLI that reports unowned files, ownerless rules, shadowed patterns, invalid lines, and ignored CODEOWNERS files.

Try: `npx codeowners-deadzone demo`

## LinkedIn Post

CODEOWNERS is easy to trust and surprisingly easy to misconfigure.

I built CODEOWNERS Dead Zone Finder, an OSS CLI that scans a repository offline with GitHub-like last-match-wins behavior. It reports unowned files, ownerless rules, shadowed patterns, invalid lines, ignored CODEOWNERS files, and risky ownership gaps.

It does not verify GitHub permissions or prove reviews are enforced. It helps teams see CODEOWNERS coverage gaps clearly enough to review and fix them.

## GitHub Release Notes

Initial release of CODEOWNERS Dead Zone Finder.

- Offline CODEOWNERS coverage scanning
- GitHub-like last-match-wins matching
- Reports unowned files, ownerless rules, shadowed patterns, invalid lines, ignored CODEOWNERS files, and risky ownership gaps
- Table, Markdown, JSON, HTML, and SARIF reports
- Demo command for trying the tool without a repository

## npm Package Description

Find unowned files, shadowed rules, and risky gaps in GitHub CODEOWNERS coverage.
