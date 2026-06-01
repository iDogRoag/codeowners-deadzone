import path from "node:path";
import fg from "fast-glob";
import { minimatch } from "minimatch";
import { CODEOWNERS_LOCATIONS } from "./types.js";
import type { Config } from "./types.js";
import { listGitFiles, isGitRepo } from "./git/files.js";
import { pathExists } from "./utils/fs.js";
import { toPosixPath } from "./utils/path.js";

export async function discoverFiles(repoPath: string, config: Config): Promise<string[]> {
  const gitRepo = await isGitRepo(repoPath);
  const files = gitRepo
    ? await listGitFiles(repoPath)
    : await fg(config.include, {
        cwd: repoPath,
        onlyFiles: true,
        dot: true,
        unique: true,
        ignore: config.exclude,
        followSymbolicLinks: false
      });

  const normalized = new Set<string>();

  for (const file of files) {
    const posix = toPosixPath(file);
    if (CODEOWNERS_LOCATIONS.includes(posix as never)) {
      normalized.add(posix);
      continue;
    }
    if (!matchesAny(posix, config.include)) {
      continue;
    }
    if (matchesAny(posix, config.exclude)) {
      continue;
    }
    normalized.add(posix);
  }

  for (const location of CODEOWNERS_LOCATIONS) {
    if (await pathExists(path.join(repoPath, location))) {
      normalized.add(location);
    }
  }

  return [...normalized].sort();
}

function matchesAny(filePath: string, patterns: string[]): boolean {
  if (patterns.length === 0) {
    return false;
  }
  return patterns.some((pattern) => minimatch(filePath, pattern, { dot: true, nocase: false }));
}
