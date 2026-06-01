import path from "node:path";
import { readFile } from "node:fs/promises";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import type { Config, FailOnPolicy } from "./types.js";
import { pathExists } from "./utils/fs.js";

export const CONFIG_FILES = [
  "codeowners-deadzone.yml",
  "codeowners-deadzone.yaml",
  ".codeowners-deadzone.yml",
  ".codeowners-deadzone.yaml"
];

export const DEFAULT_EXCLUDES = [
  ".git/**",
  "node_modules/**",
  "vendor/**",
  "dist/**",
  "build/**",
  "coverage/**",
  ".next/**",
  ".nuxt/**",
  ".turbo/**",
  ".cache/**",
  "target/**",
  "out/**",
  "tmp/**",
  "temp/**",
  ".venv/**",
  "__pycache__/**",
  ".DS_Store"
];

export const DEFAULT_IMPORTANT_PATHS = [
  "CODEOWNERS",
  ".github/CODEOWNERS",
  "docs/CODEOWNERS",
  ".github/workflows/**",
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lock",
  "pyproject.toml",
  "poetry.lock",
  "requirements.txt",
  "go.mod",
  "Cargo.toml",
  "Dockerfile",
  "docker-compose.yml",
  "compose.yml",
  "**/*.tf",
  "**/*.tfvars",
  "**/Chart.yaml",
  "**/templates/**/*.yaml",
  "**/k8s/**/*.yaml",
  "src/**",
  "app/**",
  "apps/**",
  "packages/**",
  "services/**",
  "infra/**",
  "migrations/**",
  "db/**",
  "schema/**",
  "security/**",
  "auth/**",
  "payments/**",
  "billing/**",
  "scripts/**",
  "Makefile"
];

const failOnSchema = z.enum([
  "none",
  "high",
  "medium",
  "dead-zones",
  "unowned",
  "coverage-below"
]);

const configSchema = z
  .object({
    version: z.literal(1).default(1),
    minCoverage: z.number().min(0).max(100).default(90),
    failOn: z.array(failOnSchema).default(["none"]),
    include: z.array(z.string()).default(["**/*"]),
    exclude: z.array(z.string()).default(DEFAULT_EXCLUDES),
    risk: z
      .object({
        importantPaths: z.array(z.string()).default(DEFAULT_IMPORTANT_PATHS),
        lowRiskPaths: z.array(z.string()).default([])
      })
      .default({ importantPaths: DEFAULT_IMPORTANT_PATHS, lowRiskPaths: [] }),
    trustedOwners: z.array(z.string()).default([]),
    ownerLimits: z
      .object({
        maxFilesPerOwnerPercent: z.number().min(0).max(100).default(60),
        maxUnownedFiles: z.number().int().min(0).default(Number.MAX_SAFE_INTEGER),
        maxExplicitlyUnownedFiles: z.number().int().min(0).default(Number.MAX_SAFE_INTEGER)
      })
      .default({
        maxFilesPerOwnerPercent: 60,
        maxUnownedFiles: Number.MAX_SAFE_INTEGER,
        maxExplicitlyUnownedFiles: Number.MAX_SAFE_INTEGER
      }),
    suggestions: z
      .object({
        enabled: z.boolean().default(true),
        maxRules: z.number().int().min(0).default(20),
        preferredOwners: z.array(z.string()).default([])
      })
      .default({ enabled: true, maxRules: 20, preferredOwners: [] }),
    changed: z
      .object({
        base: z.string().optional(),
        head: z.string().default("HEAD")
      })
      .default({ head: "HEAD" })
  });

export function defaultConfig(): Config {
  return configSchema.parse({});
}

export async function findConfig(repoPath: string, explicitPath?: string): Promise<string | undefined> {
  if (explicitPath) {
    const resolved = path.isAbsolute(explicitPath) ? explicitPath : path.join(repoPath, explicitPath);
    if (!(await pathExists(resolved))) {
      throw new Error(`Config file not found: ${explicitPath}`);
    }
    return resolved;
  }

  for (const candidate of CONFIG_FILES) {
    const resolved = path.join(repoPath, candidate);
    if (await pathExists(resolved)) {
      return resolved;
    }
  }

  return undefined;
}

export async function loadConfig(repoPath: string, explicitPath?: string): Promise<{ config: Config; path?: string }> {
  const configPath = await findConfig(repoPath, explicitPath);
  if (!configPath) {
    return { config: defaultConfig() };
  }

  try {
    const raw = await readFile(configPath, "utf8");
    const parsed = parseYaml(raw) ?? {};
    const config = configSchema.parse(parsed);
    return { config, path: configPath };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.issues
        .map((issue) => `${issue.path.join(".") || "config"}: ${issue.message}`)
        .join("; ");
      throw new Error(`Invalid config ${configPath}: ${details}`);
    }
    throw error;
  }
}

export function mergeCliConfig(
  config: Config,
  options: {
    include?: string[];
    exclude?: string[];
    minCoverage?: number;
    failOn?: FailOnPolicy;
    base?: string;
    head?: string;
  }
): Config {
  return {
    ...config,
    include: options.include && options.include.length > 0 ? options.include : config.include,
    exclude: options.exclude && options.exclude.length > 0 ? [...config.exclude, ...options.exclude] : config.exclude,
    minCoverage: options.minCoverage ?? config.minCoverage,
    failOn: options.failOn ? [options.failOn] : config.failOn,
    changed: {
      base: options.base ?? config.changed.base,
      head: options.head ?? config.changed.head
    }
  };
}
