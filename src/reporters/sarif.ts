import type { AnalysisResult, Finding } from "../types.js";

export function sarifReport(result: AnalysisResult): string {
  const rules = new Map<string, Finding>();
  for (const finding of result.findings) {
    if (!rules.has(finding.id)) {
      rules.set(finding.id, finding);
    }
  }

  return `${JSON.stringify(
    {
      version: "2.1.0",
      $schema: "https://json.schemastore.org/sarif-2.1.0.json",
      runs: [
        {
          tool: {
            driver: {
              name: "codeowners-deadzone",
              informationUri: "https://github.com/iDogRoag/codeowners-deadzone",
              rules: [...rules.values()].map((finding) => ({
                id: finding.id,
                name: finding.title,
                shortDescription: { text: finding.title },
                fullDescription: { text: finding.message },
                help: { text: finding.suggestion },
                properties: {
                  severity: finding.severity,
                  evidenceType: finding.evidenceType,
                  category: finding.category
                }
              }))
            }
          },
          results: result.findings.map((finding) => ({
            ruleId: finding.id,
            level: sarifLevel(finding.severity),
            message: { text: `${finding.message} ${finding.suggestion}` },
            locations: [
              {
                physicalLocation: {
                  artifactLocation: {
                    uri: finding.filePath ?? result.codeowners.activePath ?? "CODEOWNERS"
                  },
                  region: {
                    startLine: finding.lineNumber ?? finding.ruleLine ?? 1
                  }
                }
              }
            ],
            properties: {
              evidenceType: finding.evidenceType,
              evidence: finding.evidence
            }
          }))
        }
      ]
    },
    null,
    2
  )}\n`;
}

function sarifLevel(severity: string): "error" | "warning" | "note" {
  if (severity === "high") {
    return "error";
  }
  if (severity === "medium") {
    return "warning";
  }
  return "note";
}
