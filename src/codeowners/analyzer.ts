import path from "node:path";
import { minimatch } from "minimatch";
import type {
  AnalysisResult,
  CodeownersLocation,
  CodeownersRule,
  Config,
  Finding,
  FindingEvidence,
  FindingSeverity,
  OwnedFile,
  OwnerSummary,
  ParsedCodeownersFile,
  RuleAnalysis,
  RuleHealth,
  ScanOptions
} from "../types.js";
import { discoverFiles } from "../discover.js";
import { findActiveCodeowners } from "./locations.js";
import { parseCodeowners } from "./parser.js";
import { ownershipForFile } from "./matcher.js";
import { generateSuggestions } from "./suggestions.js";
import { readUtf8 } from "../utils/fs.js";
import { topLevelFolder } from "../utils/path.js";

export async function analyzeRepository(options: ScanOptions): Promise<AnalysisResult> {
  const repoPath = path.resolve(options.repoPath);
  const location = options.locationOverride ?? (await findActiveCodeowners(repoPath));
  const parsed =
    options.parsedOverride ??
    (location.activePath
      ? parseCodeowners(await readUtf8(path.join(repoPath, location.activePath)), location.activePath, location.sizeBytes)
      : undefined);

  const discovered = options.changedFiles ?? (await discoverFiles(repoPath, options.config));
  const rules = parsed?.rules.filter((rule) => rule.isValid) ?? [];
  const files = discovered.map((file) =>
    ownershipForFile(file, rules, isImportantPath(file, options.config), weightForPath(file, options.config))
  );
  const ruleAnalysis = analyzeRules(rules, files);
  const owners = summarizeOwners(files);
  const summary = summarize(files, ruleAnalysis, parsed);
  const suggestions = generateSuggestions(files, options.config);
  const warnings = [...(parsed?.warnings ?? [])];
  const findings = buildFindings({
    location,
    parsed,
    files,
    rules: ruleAnalysis,
    owners,
    summary,
    suggestions,
    config: options.config
  });
  const status = computeStatus(findings, summary, options.config);

  return {
    repoPath,
    codeowners: location,
    parsed,
    files,
    rules: ruleAnalysis,
    summary,
    owners,
    findings,
    suggestions,
    status,
    warnings
  };
}

export function isImportantPath(filePath: string, config: Config): boolean {
  if (config.risk.lowRiskPaths.some((pattern) => minimatch(filePath, pattern, { dot: true }))) {
    return false;
  }
  return config.risk.importantPaths.some((pattern) => minimatch(filePath, pattern, { dot: true }));
}

export function weightForPath(filePath: string, config: Config): number {
  if (!isImportantPath(filePath, config)) {
    return 1;
  }
  if (
    filePath === "CODEOWNERS" ||
    filePath === ".github/CODEOWNERS" ||
    filePath === "docs/CODEOWNERS" ||
    filePath.startsWith(".github/workflows/") ||
    filePath.startsWith("security/") ||
    filePath.startsWith("infra/") ||
    filePath.includes("/security/") ||
    filePath.includes("/infra/")
  ) {
    return 10;
  }
  return 3;
}

function analyzeRules(rules: CodeownersRule[], files: OwnedFile[]): RuleAnalysis[] {
  return rules.map((rule) => {
    const matchedFiles = files.filter((file) =>
      file.matchingRules.some((matched) => matched.lineNumber === rule.lineNumber)
    ).length;
    const finalFiles = files.filter((file) => file.finalRule?.lineNumber === rule.lineNumber).length;
    const overriddenFiles = matchedFiles - finalFiles;
    const health: RuleHealth = rule.isOwnerless
      ? "ownerless"
      : matchedFiles === 0
        ? "unused"
        : finalFiles === 0
          ? "fully-shadowed"
          : overriddenFiles > 0
            ? "partially-shadowed"
            : "active";

    return {
      lineNumber: rule.lineNumber,
      pattern: rule.pattern,
      owners: rule.owners,
      matchedFiles,
      finalFiles,
      overriddenFiles,
      health
    };
  });
}

function summarize(files: OwnedFile[], rules: RuleAnalysis[], parsed?: ParsedCodeownersFile) {
  const totalWeight = files.reduce((sum, file) => sum + file.weight, 0);
  const ownedWeight = files.filter((file) => file.status === "owned").reduce((sum, file) => sum + file.weight, 0);
  const totalFiles = files.length;
  const ownedFiles = files.filter((file) => file.status === "owned").length;
  const unownedFiles = files.filter((file) => file.status === "unowned").length;
  const explicitlyUnownedFiles = files.filter((file) => file.status === "explicitly-unowned").length;
  const ownerSet = new Set(files.flatMap((file) => file.owners));

  return {
    totalFiles,
    ownedFiles,
    unownedFiles,
    explicitlyUnownedFiles,
    coveragePercent: totalFiles === 0 ? 100 : (ownedFiles / totalFiles) * 100,
    weightedCoveragePercent: totalWeight === 0 ? 100 : (ownedWeight / totalWeight) * 100,
    activeRules: rules.filter((rule) => rule.health === "active" || rule.health === "partially-shadowed").length,
    unusedRules: rules.filter((rule) => rule.health === "unused").length,
    shadowedRules: rules.filter((rule) => rule.health === "fully-shadowed").length,
    invalidLines: parsed?.invalidLines.length ?? 0,
    ownerCount: ownerSet.size,
    filesWithMultipleMatchingRules: files.filter((file) => file.matchingRules.length > 1).length,
    filesOwnedByFallbackRule: files.filter((file) => file.fromFallback).length
  };
}

function summarizeOwners(files: OwnedFile[]): OwnerSummary[] {
  const ownedFiles = files.filter((file) => file.status === "owned");
  const map = new Map<string, { files: Set<string>; importantFiles: Set<string>; folders: Set<string> }>();

  for (const file of ownedFiles) {
    for (const owner of file.owners) {
      const entry =
        map.get(owner) ?? { files: new Set<string>(), importantFiles: new Set<string>(), folders: new Set<string>() };
      entry.files.add(file.path);
      if (file.important) {
        entry.importantFiles.add(file.path);
      }
      entry.folders.add(topLevelFolder(file.path));
      map.set(owner, entry);
    }
  }

  return [...map.entries()]
    .map(([owner, entry]) => ({
      owner,
      files: entry.files.size,
      importantFiles: entry.importantFiles.size,
      percentFiles: ownedFiles.length === 0 ? 0 : (entry.files.size / ownedFiles.length) * 100,
      topLevelFolders: [...entry.folders].sort()
    }))
    .sort((a, b) => b.files - a.files || a.owner.localeCompare(b.owner));
}

function buildFindings(input: {
  location: CodeownersLocation;
  parsed?: ParsedCodeownersFile;
  files: OwnedFile[];
  rules: RuleAnalysis[];
  owners: OwnerSummary[];
  summary: ReturnType<typeof summarize>;
  suggestions: unknown[];
  config: Config;
}): Finding[] {
  const findings: Finding[] = [];

  const add = (
    id: string,
    severity: FindingSeverity,
    evidenceType: FindingEvidence,
    title: string,
    message: string,
    evidence: string,
    suggestion: string,
    category: string,
    extra: Partial<Finding> = {}
  ) => {
    findings.push({ id, severity, evidenceType, title, message, evidence, suggestion, category, ...extra });
  };

  if (input.location.missing) {
    add(
      "codeowners.missing",
      "high",
      "confirmed",
      "No active CODEOWNERS file",
      "GitHub will not request CODEOWNERS-based reviews without an active CODEOWNERS file.",
      "No CODEOWNERS file was found in .github/, repo root, or docs/.",
      "Create .github/CODEOWNERS and add reviewed ownership rules.",
      "codeowners"
    );
  }

  if (input.location.oversized) {
    add(
      "codeowners.oversized",
      "high",
      "confirmed",
      "CODEOWNERS file is over 3 MB",
      "GitHub will not load a CODEOWNERS file over 3 MB.",
      `${input.location.activePath ?? "CODEOWNERS"} is ${input.location.sizeBytes} bytes.`,
      "Split or simplify CODEOWNERS until it is below 3 MB.",
      "codeowners",
      { filePath: input.location.activePath }
    );
  }

  for (const ignored of input.location.ignoredPaths) {
    add(
      `codeowners.ignored.${ignored}`,
      "medium",
      "confirmed",
      "Ignored CODEOWNERS file",
      `${ignored} exists but is ignored because GitHub uses the higher-priority CODEOWNERS location first.`,
      `Active CODEOWNERS is ${input.location.activePath}.`,
      "Delete the ignored file or merge its rules into the active CODEOWNERS file.",
      "codeowners",
      { filePath: ignored }
    );
  }

  for (const invalid of input.parsed?.invalidLines ?? []) {
    add(
      `codeowners.invalid.${invalid.lineNumber}`,
      "medium",
      "confirmed",
      "Invalid CODEOWNERS line skipped",
      invalid.reason,
      `Line ${invalid.lineNumber}: ${invalid.rawLine}`,
      "Fix the syntax so GitHub can apply the intended rule.",
      "syntax",
      { filePath: input.parsed?.path, lineNumber: invalid.lineNumber }
    );
  }

  for (const file of input.files.filter((item) => item.status === "unowned" && item.important).slice(0, 20)) {
    add(
      `file.important-unowned.${file.path}`,
      "high",
      "confirmed",
      "Important path is unowned",
      `${file.path} has no matching CODEOWNERS rule.`,
      `${file.path} matched zero valid CODEOWNERS rules.`,
      "Add a specific CODEOWNERS rule for this path.",
      "coverage",
      { filePath: file.path }
    );
  }

  for (const file of input.files.filter((item) => item.status === "explicitly-unowned" && item.important).slice(0, 20)) {
    add(
      `file.important-ownerless.${file.path}`,
      "high",
      "confirmed",
      "Ownerless rule clears important path",
      `${file.path} is explicitly unowned by the final matching rule.`,
      `Final ownerless rule is line ${file.finalRule?.lineNumber ?? "unknown"}.`,
      "Confirm the clear is intentional or add owners to the final matching rule.",
      "coverage",
      { filePath: file.path, ruleLine: file.finalRule?.lineNumber }
    );
  }

  const activeCodeowners = input.location.activePath
    ? input.files.find((file) => file.path === input.location.activePath)
    : undefined;
  if (activeCodeowners && activeCodeowners.status !== "owned") {
    add(
      "codeowners.self-unowned",
      "high",
      "confirmed",
      "CODEOWNERS file itself is unowned",
      "The active CODEOWNERS file does not have a final owner.",
      `${activeCodeowners.path} status is ${activeCodeowners.status}.`,
      "Add a trusted owner for the active CODEOWNERS file.",
      "coverage",
      { filePath: activeCodeowners.path }
    );
  }

  if (input.summary.coveragePercent < input.config.minCoverage) {
    add(
      "coverage.below-minimum",
      input.config.failOn.includes("coverage-below") ? "high" : "medium",
      "confirmed",
      "Coverage below configured minimum",
      `CODEOWNERS ownership coverage is ${input.summary.coveragePercent.toFixed(1)}%.`,
      `Minimum configured coverage is ${input.config.minCoverage}%.`,
      "Add or repair CODEOWNERS rules for unowned areas.",
      "coverage"
    );
  }

  if (input.summary.unownedFiles > 0) {
    add(
      "coverage.unowned-files",
      input.summary.unownedFiles / Math.max(input.summary.totalFiles, 1) > 0.05 ? "medium" : "low",
      "confirmed",
      "Files have no CODEOWNERS owner",
      `${input.summary.unownedFiles} files have no matching CODEOWNERS rule.`,
      `${input.summary.unownedFiles}/${input.summary.totalFiles} included files are unowned.`,
      "Review suggested CODEOWNERS additions.",
      "coverage"
    );
  }

  for (const rule of input.rules.filter((item) => item.health === "fully-shadowed").slice(0, 20)) {
    add(
      `rule.shadowed.${rule.lineNumber}`,
      "medium",
      "confirmed",
      "Rule is fully shadowed",
      `Rule line ${rule.lineNumber} matches files but never wins as the final owner.`,
      `${rule.overriddenFiles} matched files are overridden by later rules.`,
      "Remove the rule or move it below the rules that should not override it.",
      "rules",
      { ruleLine: rule.lineNumber }
    );
  }

  for (const rule of input.rules.filter((item) => item.health === "unused").slice(0, 20)) {
    add(
      `rule.unused.${rule.lineNumber}`,
      "medium",
      "confirmed",
      "Rule matches zero files",
      `Rule line ${rule.lineNumber} did not match any included file.`,
      `Pattern: ${rule.pattern}`,
      "Check for stale paths, typos, or case mismatches.",
      "rules",
      { ruleLine: rule.lineNumber }
    );
  }

  for (const owner of input.owners.filter((item) => item.percentFiles > input.config.ownerLimits.maxFilesPerOwnerPercent)) {
    add(
      `owner.concentration.${owner.owner}`,
      "medium",
      "heuristic",
      "Ownership is concentrated",
      `${owner.owner} owns ${owner.percentFiles.toFixed(1)}% of owned files.`,
      `${owner.files} files across ${owner.topLevelFolders.length} top-level areas.`,
      "Split ownership across more specific teams where appropriate.",
      "ownership",
      { owner: owner.owner }
    );
  }

  if (input.summary.filesOwnedByFallbackRule === input.summary.ownedFiles && input.summary.ownedFiles > 0) {
    add(
      "coverage.only-fallback",
      "high",
      "heuristic",
      "All owned files are owned only by fallback",
      "The repository has ownership coverage, but every owned file comes from a broad fallback rule.",
      `${input.summary.filesOwnedByFallbackRule} files are owned by fallback patterns.`,
      "Add specific rules for important areas before the fallback.",
      "coverage"
    );
  } else if (input.summary.filesOwnedByFallbackRule > 0) {
    add(
      "coverage.broad-fallback",
      "low",
      "heuristic",
      "Broad fallback owns files",
      "A fallback CODEOWNERS rule owns some files.",
      `${input.summary.filesOwnedByFallbackRule} files are owned by fallback patterns.`,
      "Confirm this is intentional and add specific rules for important areas.",
      "coverage"
    );
  }

  if (input.config.trustedOwners.length === 0) {
    add(
      "config.no-trusted-owners",
      "low",
      "unverified-offline",
      "No trusted owner configured",
      "The tool cannot verify whether CODEOWNERS itself is owned by a trusted team without configuration.",
      "trustedOwners is empty.",
      "Configure trustedOwners for stricter governance checks.",
      "config"
    );
  }

  for (const owner of input.owners.filter((item) => item.owner.includes("@") && !item.owner.startsWith("@")).slice(0, 10)) {
    add(
      `owner.email.${owner.owner}`,
      "low",
      "unverified-offline",
      "Email owner cannot be verified offline",
      `${owner.owner} looks like an email owner.`,
      "Offline mode cannot verify account existence or write access.",
      "Use optional online verification in a future workflow if needed.",
      "ownership",
      { owner: owner.owner }
    );
  }

  return findings.sort(bySeverityThenId);
}

function computeStatus(findings: Finding[], summary: { coveragePercent: number }, config: Config) {
  const failOn = new Set(config.failOn);
  const hasHigh = findings.some((finding) => finding.severity === "high");
  const hasMedium = findings.some((finding) => finding.severity === "high" || finding.severity === "medium");
  const hasDeadZones = findings.some((finding) => finding.category === "coverage" || finding.category === "rules");

  const fails =
    failOn.has("high") && hasHigh
      ? true
      : failOn.has("medium") && hasMedium
        ? true
        : failOn.has("dead-zones") && hasDeadZones
          ? true
          : failOn.has("unowned") &&
              findings.some(
                (finding) =>
                  finding.id.startsWith("coverage.unowned") ||
                  finding.id.includes("ownerless") ||
                  finding.id.includes("explicitly-unowned")
              )
            ? true
            : failOn.has("coverage-below") && summary.coveragePercent < config.minCoverage;

  if (fails) {
    return "fail";
  }
  return hasMedium ? "warn" : "pass";
}

function bySeverityThenId(a: Finding, b: Finding): number {
  const rank = { high: 0, medium: 1, low: 2 } satisfies Record<FindingSeverity, number>;
  return rank[a.severity] - rank[b.severity] || a.id.localeCompare(b.id);
}
