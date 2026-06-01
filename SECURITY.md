# Security Policy

## Supported Versions

Security fixes target the latest published version.

## Reporting a Vulnerability

Please open a private security advisory on GitHub if available, or create an issue with minimal reproduction details and avoid posting secrets.

## Security Model

`codeowners-deadzone` is an offline static analysis tool. It does not verify GitHub account existence, team visibility, write access, branch protection, or rulesets unless a future explicit online mode is added.

The tool should not execute repository code. It reads repository files, runs `git` for file discovery or diff mode, and writes output files only when requested.
