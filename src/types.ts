export const CODEOWNERS_LOCATIONS = [
  ".github/CODEOWNERS",
  "CODEOWNERS",
  "docs/CODEOWNERS"
] as const;

export type CodeownersLocationPath = (typeof CODEOWNERS_LOCATIONS)[number];

export type FindingSeverity = "high" | "medium" | "low";
export type FindingEvidence = "confirmed" | "heuristic" | "unverified-offline";
export type ReportStatus = "pass" | "warn" | "fail";
export type OwnershipStatus = "owned" | "unowned" | "explicitly-unowned";
export type RuleHealth =
  | "active"
  | "unused"
  | "partially-shadowed"
  | "fully-shadowed"
  | "ownerless"
  | "invalid";

export interface CodeownersLocation {
  activePath?: string;
  ignoredPaths: string[];
  missing: boolean;
  sizeBytes: number;
  lineCount: number;
  oversized: boolean;
}

export interface InvalidLine {
  lineNumber: number;
  rawLine: string;
  reason: string;
}

export interface CodeownersRule {
  lineNumber: number;
  rawLine: string;
  pattern: string;
  normalizedPattern: string;
  owners: string[];
  inlineComment?: string;
  isComment: boolean;
  isBlank: boolean;
  hasOwners: boolean;
  isOwnerless: boolean;
  isValid: boolean;
  invalidReason?: string;
}

export interface ParsedCodeownersFile {
  path: string;
  sizeBytes: number;
  lines: number;
  rules: CodeownersRule[];
  invalidLines: InvalidLine[];
  warnings: string[];
}

export interface MatchedRule {
  lineNumber: number;
  pattern: string;
  owners: string[];
  isOwnerless: boolean;
}

export interface OwnedFile {
  path: string;
  status: OwnershipStatus;
  owners: string[];
  finalRule?: MatchedRule;
  matchingRules: MatchedRule[];
  important: boolean;
  weight: number;
  fromFallback: boolean;
}

export interface RuleAnalysis {
  lineNumber: number;
  pattern: string;
  owners: string[];
  matchedFiles: number;
  finalFiles: number;
  overriddenFiles: number;
  health: RuleHealth;
}

export interface OwnerSummary {
  owner: string;
  files: number;
  importantFiles: number;
  percentFiles: number;
  topLevelFolders: string[];
}

export interface OwnershipSummary {
  totalFiles: number;
  ownedFiles: number;
  unownedFiles: number;
  explicitlyUnownedFiles: number;
  coveragePercent: number;
  weightedCoveragePercent: number;
  activeRules: number;
  unusedRules: number;
  shadowedRules: number;
  invalidLines: number;
  ownerCount: number;
  filesWithMultipleMatchingRules: number;
  filesOwnedByFallbackRule: number;
}

export interface Finding {
  id: string;
  severity: FindingSeverity;
  evidenceType: FindingEvidence;
  title: string;
  message: string;
  filePath?: string;
  lineNumber?: number;
  ruleLine?: number;
  owner?: string;
  evidence: string;
  suggestion: string;
  category: string;
}

export interface Suggestion {
  path: string;
  owners: string[];
  reason: string;
}

export interface AnalysisResult {
  repoPath: string;
  codeowners: CodeownersLocation;
  parsed?: ParsedCodeownersFile;
  files: OwnedFile[];
  rules: RuleAnalysis[];
  summary: OwnershipSummary;
  owners: OwnerSummary[];
  findings: Finding[];
  suggestions: Suggestion[];
  status: ReportStatus;
  warnings: string[];
}

export interface ExplainResult {
  file: OwnedFile;
  codeowners: CodeownersLocation;
  parsed?: ParsedCodeownersFile;
  suggestion?: Suggestion;
}

export type FailOnPolicy =
  | "none"
  | "high"
  | "medium"
  | "dead-zones"
  | "unowned"
  | "coverage-below";

export type FailOnNewPolicy = "high" | "medium" | "unowned" | "dead-zones";

export interface Config {
  version: 1;
  minCoverage: number;
  failOn: FailOnPolicy[];
  include: string[];
  exclude: string[];
  risk: {
    importantPaths: string[];
    lowRiskPaths: string[];
  };
  trustedOwners: string[];
  ownerLimits: {
    maxFilesPerOwnerPercent: number;
    maxUnownedFiles: number;
    maxExplicitlyUnownedFiles: number;
  };
  suggestions: {
    enabled: boolean;
    maxRules: number;
    preferredOwners: string[];
  };
  changed: {
    base?: string;
    head: string;
  };
}

export interface ScanOptions {
  repoPath: string;
  config: Config;
  showFiles?: boolean;
  showRules?: boolean;
  changedFiles?: string[];
  parsedOverride?: ParsedCodeownersFile;
  locationOverride?: CodeownersLocation;
}

export interface ChangedFilesOptions {
  repoPath: string;
  base?: string;
  head: string;
}

export interface Reporter {
  format(result: AnalysisResult): string;
}
