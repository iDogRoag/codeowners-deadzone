import type { AnalysisResult } from "../types.js";
import { escapeHtml, formatPercent } from "../utils/text.js";

export function htmlReport(result: AnalysisResult): string {
  const findingRows = result.findings
    .map(
      (finding) => `<tr>
<td>${escapeHtml(finding.severity)}</td>
<td>${escapeHtml(finding.evidenceType)}</td>
<td>${escapeHtml(finding.title)}</td>
<td>${escapeHtml(finding.filePath ?? (finding.ruleLine ? `line ${finding.ruleLine}` : ""))}</td>
<td>${escapeHtml(finding.suggestion)}</td>
</tr>`
    )
    .join("\n");

  const ownerRows = result.owners
    .slice(0, 20)
    .map(
      (owner) => `<tr>
<td>${escapeHtml(owner.owner)}</td>
<td>${owner.files}</td>
<td>${owner.importantFiles}</td>
<td>${formatPercent(owner.percentFiles)}</td>
</tr>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CODEOWNERS Dead Zone Report</title>
<style>
body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;margin:2rem;line-height:1.5;color:#17202a;background:#fff}
table{border-collapse:collapse;width:100%;margin:1rem 0}
th,td{border:1px solid #d7dde5;padding:.5rem;text-align:left;vertical-align:top}
th{background:#f4f6f8}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));gap:1rem}
.card{border:1px solid #d7dde5;border-radius:8px;padding:1rem}
.muted{color:#5b6573}
</style>
</head>
<body>
<h1>CODEOWNERS Dead Zone Report</h1>
<div class="cards">
<div class="card"><strong>Status</strong><br>${escapeHtml(result.status)}</div>
<div class="card"><strong>Files</strong><br>${result.summary.totalFiles}</div>
<div class="card"><strong>Coverage</strong><br>${formatPercent(result.summary.coveragePercent)}</div>
<div class="card"><strong>Weighted</strong><br>${formatPercent(result.summary.weightedCoveragePercent)}</div>
</div>
<h2>Findings</h2>
<table><thead><tr><th>Severity</th><th>Evidence</th><th>Finding</th><th>Location</th><th>Suggestion</th></tr></thead><tbody>
${findingRows || "<tr><td colspan=\"5\">No meaningful findings.</td></tr>"}
</tbody></table>
<h2>Top Owners</h2>
<table><thead><tr><th>Owner</th><th>Files</th><th>Important Files</th><th>Percent</th></tr></thead><tbody>
${ownerRows || "<tr><td colspan=\"4\">No owners found.</td></tr>"}
</tbody></table>
<p class="muted">Static offline analysis. Owner existence, team visibility, write access, and branch protection are not verified.</p>
</body>
</html>
`;
}
