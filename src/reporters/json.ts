import type { AnalysisResult } from "../types.js";

export function jsonReport(result: AnalysisResult): string {
  return `${JSON.stringify(
    {
      schemaVersion: 1,
      status: result.status,
      repo: {
        path: result.repoPath
      },
      codeowners: result.codeowners,
      summary: result.summary,
      owners: result.owners,
      rules: result.rules,
      files: result.files,
      findings: result.findings,
      suggestions: result.suggestions,
      badge: result.badge,
      warnings: result.warnings
    },
    null,
    2
  )}\n`;
}
