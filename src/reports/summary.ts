import type { AnalysisResult, FailOnNewPolicy, Finding } from "../types.js";

export interface BaselineReport {
  schemaVersion: 1;
  fingerprints: string[];
}

export function findingFingerprint(finding: Finding): string {
  return [
    finding.id,
    finding.filePath ?? "",
    finding.lineNumber ?? "",
    finding.ruleLine ?? "",
    finding.owner ?? "",
    finding.message
  ].join("|");
}

export function makeBaseline(result: AnalysisResult): BaselineReport {
  return {
    schemaVersion: 1,
    fingerprints: result.findings.map(findingFingerprint).sort()
  };
}

export function newFindings(result: AnalysisResult, baseline: BaselineReport): Finding[] {
  const known = new Set(baseline.fingerprints);
  return result.findings.filter((finding) => !known.has(findingFingerprint(finding)));
}

export function shouldFailOnNew(findings: Finding[], policy?: FailOnNewPolicy): boolean {
  if (!policy) {
    return false;
  }
  if (policy === "high") {
    return findings.some((finding) => finding.severity === "high");
  }
  if (policy === "medium") {
    return findings.some((finding) => finding.severity === "high" || finding.severity === "medium");
  }
  if (policy === "unowned") {
    return findings.some((finding) => finding.id.includes("unowned") || finding.id.includes("ownerless"));
  }
  return findings.some((finding) => finding.category === "coverage" || finding.category === "rules");
}
