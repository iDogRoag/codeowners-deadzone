import pc from "picocolors";
import type { AnalysisResult } from "../types.js";
import { formatPercent } from "../utils/text.js";

export function tableReport(result: AnalysisResult): string {
  const lines: string[] = [];
  const colorStatus =
    result.status === "fail" ? pc.red(result.status) : result.status === "warn" ? pc.yellow(result.status) : pc.green(result.status);
  const highFindings = result.findings.filter((item) => item.severity === "high").length;
  const mediumFindings = result.findings.filter((item) => item.severity === "medium").length;
  const lowFindings = result.findings.filter((item) => item.severity === "low").length;

  lines.push(`${pc.bold("CODEOWNERS Dead Zone Finder")} ${colorStatus}`);
  lines.push(`Coverage: ${formatPercent(result.summary.coveragePercent)}`);
  lines.push(`Weighted coverage: ${formatPercent(result.summary.weightedCoveragePercent)}`);
  lines.push(`Files scanned: ${result.summary.totalFiles}`);
  lines.push(`Unowned files: ${result.summary.unownedFiles}`);
  lines.push(`Explicitly unowned files: ${result.summary.explicitlyUnownedFiles}`);
  lines.push(`Invalid lines: ${result.summary.invalidLines}`);
  lines.push(`Shadowed rules: ${result.summary.shadowedRules}`);
  lines.push(`Findings: ${highFindings} high, ${mediumFindings} medium, ${lowFindings} low`);
  if (result.badge) {
    lines.push(result.badge.markdown);
  }
  lines.push("");
  lines.push(`Repo: ${result.repoPath}`);
  lines.push(`Active CODEOWNERS: ${result.codeowners.activePath ?? pc.red("missing")}`);
  if (result.codeowners.ignoredPaths.length > 0) {
    lines.push(`Ignored CODEOWNERS: ${result.codeowners.ignoredPaths.join(", ")}`);
  }
  if (result.codeowners.missing) {
    lines.push("");
    lines.push("No CODEOWNERS file found.");
    lines.push("GitHub looks for CODEOWNERS in .github/CODEOWNERS, CODEOWNERS, then docs/CODEOWNERS.");
    lines.push("Try codeowners-deadzone demo to see an example report.");
  }
  lines.push("");

  if (result.findings.length > 0) {
    lines.push(pc.bold("Top dead zones"));
    for (const finding of result.findings.slice(0, 5)) {
      const label =
        finding.severity === "high" ? pc.red(finding.severity) : finding.severity === "medium" ? pc.yellow(finding.severity) : finding.severity;
      lines.push(`- [${label}/${finding.evidenceType}] ${finding.title}`);
      lines.push(`  ${finding.filePath ?? finding.evidence}`);
      lines.push(`  ${finding.suggestion}`);
    }
    if (result.findings.length > 5) {
      lines.push("");
      lines.push("Showing top 5 findings.");
      lines.push("Use --format markdown, --show-files, or --show-rules for details.");
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
