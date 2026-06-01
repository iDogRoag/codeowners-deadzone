import { fileURLToPath } from "node:url";
import path from "node:path";
import { Command, InvalidArgumentError, Option } from "commander";
import { pathExists, readUtf8, writeUtf8 } from "./utils/fs.js";
import { analyzeRepository } from "./codeowners/analyzer.js";
import { findActiveCodeownersFromGitRef } from "./codeowners/locations.js";
import { parseCodeowners } from "./codeowners/parser.js";
import { loadConfig, mergeCliConfig } from "./config.js";
import { changedFiles } from "./git/diff.js";
import { resolveDefaultBase } from "./git/files.js";
import { jsonReport } from "./reporters/json.js";
import { markdownReport } from "./reporters/markdown.js";
import { htmlReport } from "./reporters/html.js";
import { tableReport } from "./reporters/table.js";
import { sarifReport } from "./reporters/sarif.js";
import { makeCoverageBadge } from "./reports/badge.js";
import { makeBaseline, newFindings, shouldFailOnNew } from "./reports/summary.js";
import type {
  AnalysisResult,
  Config,
  FailOnNewPolicy,
  FailOnPolicy,
  ParsedCodeownersFile
} from "./types.js";

type Format = "table" | "json" | "markdown" | "html" | "sarif";

interface GlobalOptions {
  format?: Format;
  output?: string;
  config?: string;
  include?: string[];
  exclude?: string[];
  showFiles?: boolean;
  showRules?: boolean;
  maxFiles?: number;
  minCoverage?: number;
  failOn?: FailOnPolicy;
  failOnNew?: FailOnNewPolicy;
  baseline?: string;
  writeBaseline?: string;
  base?: string;
  head?: string;
  badge?: boolean;
  ci?: boolean;
  quiet?: boolean;
  strict?: boolean;
  verbose?: boolean;
  force?: boolean;
}

interface Io {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

const DEFAULT_IO: Io = {
  stdout: (value) => process.stdout.write(value),
  stderr: (value) => process.stderr.write(value)
};

export async function run(argv = process.argv, io: Io = DEFAULT_IO): Promise<number> {
  const program = new Command();
  let commandExitCode = 0;

  program
    .name("codeowners-deadzone")
    .description("Find weak, missing, or misleading CODEOWNERS ownership coverage.")
    .addOption(new Option("--format <format>", "report format").choices(["table", "json", "markdown", "html", "sarif"]).default("table"))
    .option("--output <file>", "write report to file")
    .option("--config <file>", "use config file")
    .option("--include <glob>", "include files matching glob", collect, [])
    .option("--exclude <glob>", "exclude files matching glob", collect, [])
    .option("--show-files", "show file-level ownership details")
    .option("--show-rules", "show parsed CODEOWNERS rules and match counts")
    .option("--max-files <number>", "safety limit for huge repos", parsePositiveInteger, 200000)
    .option("--min-coverage <percent>", "minimum acceptable ownership coverage", parsePercent)
    .addOption(new Option("--fail-on <policy>", "fail policy").choices(["none", "high", "medium", "dead-zones", "unowned", "coverage-below"]))
    .option("--baseline <file>", "compare findings against a baseline file")
    .option("--write-baseline <file>", "write current findings as a baseline file")
    .addOption(new Option("--fail-on-new <policy>", "fail only on new findings").choices(["high", "medium", "unowned", "dead-zones"]))
    .option("--base <ref>", "base ref for changed mode")
    .option("--head <ref>", "head ref for changed mode", "HEAD")
    .option("--badge", "print coverage badge Markdown or include badge data in reports")
    .option("--ci", "machine-friendly mode")
    .option("--quiet", "only print final result and errors")
    .option("--strict", "treat low-severity findings as warning status")
    .option("--verbose", "print extra debug info");
  program.configureOutput({
    writeOut: io.stdout,
    writeErr: io.stderr
  });
  program.exitOverride();

  program
    .command("scan")
    .argument("[path]", "repository path", ".")
    .description("Scan a repository and print CODEOWNERS ownership coverage.")
    .action(async (repoArg: string) => {
      const code = await commandErrorBoundary(io, async () => {
        const repoPath = path.resolve(repoArg);
        const options = program.opts<GlobalOptions>();
        const config = await readMergedConfig(repoPath, options);
        const result = await analyzeRepository({ repoPath, config });
        await applyBaselineOptions(result, options, io);
        applyBadgeOptions(result, options);
        applyStatusOptions(result, options);
        return await emitResult(result, options, io);
      });
      commandExitCode = code;
    });

  program
    .command("explain")
    .argument("<file>", "file to explain")
    .argument("[path]", "repository path", ".")
    .description("Explain which CODEOWNERS rule owns a file.")
    .action(async (fileArg: string, repoArg: string) => {
      const code = await commandErrorBoundary(io, async () => {
        const repoPath = path.resolve(repoArg);
        const options = program.opts<GlobalOptions>();
        const config = await readMergedConfig(repoPath, options);
        const filePath = fileArg.replace(/\\/g, "/").replace(/^\.\//, "");
        const result = await analyzeRepository({ repoPath, config, changedFiles: [filePath] });
        const file = result.files[0];
        if (!file) {
          throw Object.assign(new Error(`Unable to analyze file: ${filePath}`), { exitCode: 2 });
        }
        await applyBaselineOptions(result, options, io);
        applyBadgeOptions(result, options);
        applyStatusOptions(result, options);
        const output =
          options.format === "json"
            ? `${JSON.stringify({ schemaVersion: 1, file, codeowners: result.codeowners, suggestions: result.suggestions }, null, 2)}\n`
            : options.format === "markdown"
              ? explainMarkdown(result)
              : explainTable(result);
        await emitOutput(output, options.output);
        if (!options.output && !options.quiet) {
          io.stdout(output);
        }
        return result.status === "fail" ? 1 : 0;
      });
      commandExitCode = code;
    });

  program
    .command("changed")
    .argument("[path]", "repository path", ".")
    .description("Analyze only files changed against a git base ref.")
    .action(async (repoArg: string) => {
      const code = await commandErrorBoundary(
        io,
        async () => {
          const repoPath = path.resolve(repoArg);
          const options = program.opts<GlobalOptions>();
          const config = await readMergedConfig(repoPath, options);
          const base = config.changed.base ?? (await resolveDefaultBase(repoPath));
          const head = config.changed.head;
          const files = await changedFiles({ repoPath, base, head });
          const { parsed, location, warnings } = await codeownersFromBaseRef(repoPath, base);
          const result = await analyzeRepository({
            repoPath,
            config,
            changedFiles: files,
            parsedOverride: parsed,
            locationOverride: location
          });
          result.warnings.push(...warnings);
          await applyBaselineOptions(result, options, io);
          applyBadgeOptions(result, options);
          applyStatusOptions(result, options);
          return await emitResult(result, options, io);
        },
        3
      );
      commandExitCode = code;
    });

  program
    .command("init")
    .argument("[path]", "repository path", ".")
    .description("Create a starter codeowners-deadzone.yml config.")
    .option("--force", "overwrite an existing config")
    .action(async (repoArg: string, localOptions: GlobalOptions) => {
      const code = await commandErrorBoundary(io, async () => {
        const repoPath = path.resolve(repoArg);
        const configPath = path.join(repoPath, "codeowners-deadzone.yml");
        if ((await pathExists(configPath)) && !localOptions.force) {
          throw Object.assign(new Error("codeowners-deadzone.yml already exists. Use --force to overwrite."), {
            exitCode: 2
          });
        }
        await writeUtf8(configPath, starterConfig());
        io.stdout(`Created ${configPath}\n`);
        return 0;
      });
      commandExitCode = code;
    });

  program
    .command("demo")
    .description("Scan a bundled example repo with meaningful CODEOWNERS dead zones.")
    .action(async () => {
      const code = await commandErrorBoundary(io, async () => {
        const repoPath = resolveBundledExamplePath("dead-zones");
        const options = program.opts<GlobalOptions>();
        const config = await readMergedConfig(repoPath, options);
        const result = await analyzeRepository({ repoPath, config });
        await applyBaselineOptions(result, options, io);
        applyBadgeOptions(result, options);
        applyStatusOptions(result, options);
        return await emitResult(result, options, io);
      });
      commandExitCode = code;
    });

  program.addHelpText(
    "after",
    `

Examples:
  codz scan .
  codz scan --format markdown --output codeowners-deadzone-report.md
  codz demo --badge
  codz changed --base origin/main --head HEAD --fail-on-new high
  codz explain src/app.ts --format markdown
`
  );

  try {
    await program.parseAsync(argv);
  } catch (error) {
    if (isCommanderHelp(error)) {
      return 0;
    }
    if (isCommanderExit(error)) {
      return 2;
    }
    throw error;
  }
  return commandExitCode;
}

async function readMergedConfig(repoPath: string, options: GlobalOptions): Promise<Config> {
  const { config } = await loadConfig(repoPath, options.config);
  return mergeCliConfig(config, {
    include: options.include,
    exclude: options.exclude,
    minCoverage: options.minCoverage ? Number(options.minCoverage) : undefined,
    failOn: options.failOn,
    base: options.base,
    head: options.head
  });
}

function applyStatusOptions(result: AnalysisResult, options: GlobalOptions): void {
  if (options.strict && result.status === "pass" && result.findings.length > 0) {
    result.status = "warn";
  }
}

function applyBadgeOptions(result: AnalysisResult, options: GlobalOptions): void {
  if (options.badge) {
    result.badge = makeCoverageBadge(result);
  }
}

function resolveBundledExamplePath(name: string): string {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(currentDir, "..", "examples", name);
}

async function codeownersFromBaseRef(
  repoPath: string,
  base: string
): Promise<{ parsed?: ParsedCodeownersFile; location: AnalysisResult["codeowners"]; warnings: string[] }> {
  const fromRef = await findActiveCodeownersFromGitRef(repoPath, base);
  if (!fromRef.content || !fromRef.location.activePath) {
    return {
      location: fromRef.location,
      warnings: [
        ...fromRef.warnings,
        `changed mode could not find CODEOWNERS on ${base}; analysis falls back to missing CODEOWNERS state`
      ]
    };
  }

  return {
    location: fromRef.location,
    parsed: parseCodeowners(fromRef.content, fromRef.location.activePath, fromRef.location.sizeBytes),
    warnings: fromRef.warnings
  };
}

async function applyBaselineOptions(result: AnalysisResult, options: GlobalOptions, io: Io): Promise<void> {
  if (options.baseline) {
    const baseline = JSON.parse(await readUtf8(path.resolve(options.baseline))) as { fingerprints?: string[] };
    const fresh = newFindings(result, { schemaVersion: 1, fingerprints: baseline.fingerprints ?? [] });
    if (shouldFailOnNew(fresh, options.failOnNew)) {
      result.status = "fail";
      result.warnings.push(`${fresh.length} new findings matched --fail-on-new ${options.failOnNew}.`);
    }
  }

  if (options.writeBaseline) {
    const baselinePath = path.resolve(options.writeBaseline);
    await writeUtf8(baselinePath, `${JSON.stringify(makeBaseline(result), null, 2)}\n`);
    if (!options.quiet) {
      io.stderr(`Wrote baseline ${baselinePath}\n`);
    }
  }
}

async function emitResult(result: AnalysisResult, options: GlobalOptions, io: Io): Promise<number> {
  const maxFiles = options.maxFiles ?? 200000;
  if (result.summary.totalFiles > maxFiles) {
    throw Object.assign(new Error(`Repo exceeded safety limit: ${result.summary.totalFiles} files > ${maxFiles}`), {
      exitCode: 4
    });
  }

  const output = formatResult(result, options.format ?? "table", options);
  await emitOutput(output, options.output);
  if (!options.output && !options.quiet) {
    io.stdout(output);
  }
  return result.status === "fail" ? 1 : 0;
}

function formatResult(result: AnalysisResult, format: Format, options: GlobalOptions): string {
  if (format === "json") {
    return jsonReport(result);
  }
  if (format === "markdown") {
    return markdownReport(result);
  }
  if (format === "html") {
    return htmlReport(result);
  }
  if (format === "sarif") {
    return sarifReport(result);
  }
  let output = tableReport(result);
  if (options.showFiles) {
    output += `\nFiles\n${result.files
      .map((file) => `${file.status.padEnd(18)} ${file.path} ${file.owners.join(", ")}`)
      .join("\n")}\n`;
  }
  if (options.showRules) {
    output += `\nRules\n${result.rules
      .map((rule) => `line ${rule.lineNumber} ${rule.health} matched=${rule.matchedFiles} final=${rule.finalFiles} ${rule.pattern}`)
      .join("\n")}\n`;
  }
  return output;
}

async function emitOutput(output: string, outputPath?: string): Promise<void> {
  if (outputPath) {
    await writeUtf8(path.resolve(outputPath), output);
  }
}

async function commandErrorBoundary(io: Io, fn: () => Promise<number>, defaultExitCode = 2): Promise<number> {
  try {
    return await fn();
  } catch (error) {
    const exitCode = typeof error === "object" && error && "exitCode" in error ? Number(error.exitCode) : defaultExitCode;
    io.stderr(`${error instanceof Error ? error.message : String(error)}\n`);
    return exitCode;
  }
}

function collect(value: string, previous: string[]): string[] {
  previous.push(value);
  return previous;
}

function parsePositiveInteger(value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new InvalidArgumentError("must be a positive integer");
  }
  return parsed;
}

function parsePercent(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    throw new InvalidArgumentError("must be a number from 0 to 100");
  }
  return parsed;
}

function explainTable(result: AnalysisResult): string {
  const file = result.files[0];
  if (!file) {
    return "";
  }

  const lines = [];
  lines.push(file.path);
  lines.push(`Status: ${file.status}`);
  lines.push(`Final owner: ${file.owners.join(", ") || "(none)"}`);
  if (file.finalRule) {
    lines.push(`Final rule: line ${file.finalRule.lineNumber} ${file.finalRule.pattern}`);
  }
  lines.push("");
  lines.push("Matching rules");
  for (const rule of file.matchingRules) {
    lines.push(`  line ${rule.lineNumber}  ${rule.pattern}  ${rule.owners.join(" ") || "(ownerless)"}`);
  }
  lines.push("");
  lines.push("Why");
  lines.push(
    file.finalRule
      ? `CODEOWNERS uses last match wins, so line ${file.finalRule.lineNumber} is the final rule.`
      : "No valid CODEOWNERS rule matched this file."
  );
  if (file.status !== "owned" && result.suggestions[0]) {
    lines.push(`Suggestion: ${result.suggestions[0].path} ${result.suggestions[0].owners.join(" ")}`);
  }
  return `${lines.join("\n")}\n`;
}

function explainMarkdown(result: AnalysisResult): string {
  const file = result.files[0];
  if (!file) {
    return "";
  }
  const lines = [`# CODEOWNERS Explanation: ${file.path}`, "", `- Status: ${file.status}`, `- Final owner: ${file.owners.join(", ") || "(none)"}`];
  if (file.finalRule) {
    lines.push(`- Final rule: line ${file.finalRule.lineNumber} \`${file.finalRule.pattern}\``);
  }
  lines.push("", "## Matching Rules", "");
  for (const rule of file.matchingRules) {
    lines.push(`- line ${rule.lineNumber}: \`${rule.pattern}\` ${rule.owners.join(" ") || "(ownerless)"}`);
  }
  lines.push("", "CODEOWNERS uses last match wins. Static offline analysis does not verify branch protection.");
  return `${lines.join("\n")}\n`;
}

function starterConfig(): string {
  return `version: 1
minCoverage: 95
failOn:
  - high
  - coverage-below
include:
  - "**/*"
exclude:
  - "node_modules/**"
  - "dist/**"
  - "coverage/**"
  - ".git/**"
risk:
  importantPaths:
    - ".github/workflows/**"
    - "infra/**"
    - "services/billing/**"
trustedOwners:
  - "@my-org/platform"
  - "@my-org/security"
ownerLimits:
  maxFilesPerOwnerPercent: 60
  maxUnownedFiles: 0
  maxExplicitlyUnownedFiles: 0
suggestions:
  enabled: true
  maxRules: 20
  preferredOwners:
    - "@TODO-owner"
changed:
  head: HEAD
`;
}

function isCommanderHelp(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "commander.helpDisplayed");
}

function isCommanderExit(error: unknown): error is { exitCode: number } {
  return Boolean(error && typeof error === "object" && "exitCode" in error && typeof error.exitCode === "number");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  void run().then((code) => {
    process.exitCode = code;
  });
}
