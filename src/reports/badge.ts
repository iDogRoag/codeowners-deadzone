import type { AnalysisResult, CoverageBadge } from "../types.js";

export function makeCoverageBadge(result: AnalysisResult): CoverageBadge {
  const coverage = Math.round(result.summary.coveragePercent);
  const color = badgeColor(coverage);
  const encodedLabel = `CODEOWNERS-${coverage}%25-${color}`;

  return {
    markdown: `![codeowners coverage](https://img.shields.io/badge/${encodedLabel})`,
    label: `CODEOWNERS ${coverage}%`,
    color
  };
}

export function badgeColor(coverage: number): CoverageBadge["color"] {
  if (coverage >= 95) {
    return "brightgreen";
  }
  if (coverage >= 80) {
    return "green";
  }
  if (coverage >= 60) {
    return "yellow";
  }
  if (coverage >= 40) {
    return "orange";
  }
  return "red";
}
