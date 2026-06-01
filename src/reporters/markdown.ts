import type { AnalysisResult } from "../types.js";
import { formatPercent, markdownCell } from "../utils/text.js";

export function markdownReport(result: AnalysisResult): string {
  const lines: string[] = [];
  lines.push("# CODEOWNERS Dead Zone Report");
  lines.push("");
  lines.push("| Field | Value |");
  lines.push("| --- | --- |");
  lines.push(`| Status | ${result.status} |`);
  lines.push(`| Active CODEOWNERS | ${result.codeowners.activePath ?? "missing"} |`);
  lines.push(`| Files scanned | ${result.summary.totalFiles} |`);
  lines.push(`| Coverage | ${formatPercent(result.summary.coveragePercent)} |`);
  lines.push(`| Weighted coverage | ${formatPercent(result.summary.weightedCoveragePercent)} |`);
  lines.push(`| Findings | ${result.findings.length} |`);
  lines.push("");

  if (result.codeowners.ignoredPaths.length > 0) {
    lines.push("## Ignored CODEOWNERS Files");
    lines.push("");
    for (const ignored of result.codeowners.ignoredPaths) {
      lines.push(`- ${ignored}`);
    }
    lines.push("");
  }

  lines.push("## Dead Zones");
  lines.push("");
  if (result.findings.length === 0) {
    lines.push("No meaningful findings.");
  } else {
    lines.push("| Severity | Evidence | Finding | Location | Suggestion |");
    lines.push("| --- | --- | --- | --- | --- |");
    for (const finding of result.findings.slice(0, 50)) {
      lines.push(
        `| ${finding.severity} | ${finding.evidenceType} | ${markdownCell(finding.title)} | ${markdownCell(
          finding.filePath ?? (finding.ruleLine ? `line ${finding.ruleLine}` : "")
        )} | ${markdownCell(finding.suggestion)} |`
      );
    }
  }
  lines.push("");

  const importantUnowned = result.files.filter((file) => file.important && file.status !== "owned").slice(0, 25);
  if (importantUnowned.length > 0) {
    lines.push("## Important Unowned Files");
    lines.push("");
    for (const file of importantUnowned) {
      lines.push(`- ${file.path} (${file.status})`);
    }
    lines.push("");
  }

  if (result.suggestions.length > 0) {
    lines.push("## Suggested CODEOWNERS Additions");
    lines.push("");
    lines.push("```CODEOWNERS");
    for (const suggestion of result.suggestions) {
      lines.push(`${suggestion.path} ${suggestion.owners.join(" ")}`);
    }
    lines.push("```");
    lines.push("");
    lines.push("Suggestions use placeholders unless preferred owners are configured. Review them before committing.");
    lines.push("");
  }

  lines.push("_Static offline analysis. Owner existence, team visibility, write access, and branch protection are not verified._");
  return `${lines.join("\n")}\n`;
}
