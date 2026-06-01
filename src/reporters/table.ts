import pc from "picocolors";
import type { AnalysisResult } from "../types.js";
import { formatPercent } from "../utils/text.js";

export function tableReport(result: AnalysisResult): string {
  const lines: string[] = [];
  const colorStatus =
    result.status === "fail" ? pc.red(result.status) : result.status === "warn" ? pc.yellow(result.status) : pc.green(result.status);

  lines.push(`${pc.bold("CODEOWNERS Dead Zone Finder")} ${colorStatus}`);
  lines.push(`Repo: ${result.repoPath}`);
  lines.push(`Active CODEOWNERS: ${result.codeowners.activePath ?? pc.red("missing")}`);
  if (result.codeowners.ignoredPaths.length > 0) {
    lines.push(`Ignored CODEOWNERS: ${result.codeowners.ignoredPaths.join(", ")}`);
  }
  lines.push(
    `Files: ${result.summary.totalFiles}  Coverage: ${formatPercent(
      result.summary.coveragePercent
    )}  Weighted: ${formatPercent(result.summary.weightedCoveragePercent)}`
  );
  lines.push(
    `Findings: ${result.findings.filter((item) => item.severity === "high").length} high, ${
      result.findings.filter((item) => item.severity === "medium").length
    } medium, ${result.findings.filter((item) => item.severity === "low").length} low`
  );
  lines.push("");

  if (result.findings.length > 0) {
    lines.push(pc.bold("Top dead zones"));
    for (const finding of result.findings.slice(0, 12)) {
      const label =
        finding.severity === "high" ? pc.red(finding.severity) : finding.severity === "medium" ? pc.yellow(finding.severity) : finding.severity;
      lines.push(`- [${label}/${finding.evidenceType}] ${finding.title}`);
      lines.push(`  ${finding.filePath ?? finding.evidence}`);
      lines.push(`  ${finding.suggestion}`);
    }
    lines.push("");
  }

  if (result.owners.length > 0) {
    lines.push(pc.bold("Top owners"));
    for (const owner of result.owners.slice(0, 8)) {
      lines.push(`- ${owner.owner}: ${owner.files} files (${formatPercent(owner.percentFiles)})`);
    }
    lines.push("");
  }

  if (result.suggestions.length > 0) {
    lines.push(pc.bold("Suggested CODEOWNERS additions"));
    for (const suggestion of result.suggestions) {
      lines.push(`${suggestion.path} ${suggestion.owners.join(" ")}`);
    }
    lines.push("Review suggestions before committing.");
    lines.push("");
  }

  lines.push("Static offline analysis: owner existence, write access, and branch protection are not verified.");
  return `${lines.join("\n")}\n`;
}
