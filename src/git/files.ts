import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { CODEOWNERS_LOCATIONS } from "../types.js";
import { toPosixPath } from "../utils/path.js";
import { pathExists } from "../utils/fs.js";

const execFileAsync = promisify(execFile);

export async function isGitRepo(repoPath: string): Promise<boolean> {
  try {
    await execFileAsync("git", ["rev-parse", "--is-inside-work-tree"], { cwd: repoPath });
    return true;
  } catch {
    return false;
  }
}

export async function listGitFiles(repoPath: string): Promise<string[]> {
  const { stdout } = await execFileAsync("git", ["ls-files"], { cwd: repoPath, maxBuffer: 1024 * 1024 * 50 });
  const files = stdout
    .split(/\r?\n/)
    .map((line) => toPosixPath(line.trim()))
    .filter(Boolean);

  for (const location of CODEOWNERS_LOCATIONS) {
    if ((await pathExists(path.join(repoPath, location))) && !files.includes(location)) {
      files.push(location);
    }
  }

  return files.sort();
}

export async function resolveDefaultBase(repoPath: string): Promise<string> {
  for (const candidate of ["origin/main", "main"]) {
    try {
      await execFileAsync("git", ["rev-parse", "--verify", candidate], { cwd: repoPath });
      return candidate;
    } catch {
      continue;
    }
  }
  return "main";
}

export async function readFileFromRef(repoPath: string, ref: string, filePath: string): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync("git", ["show", `${ref}:${filePath}`], {
      cwd: repoPath,
      maxBuffer: 1024 * 1024 * 10
    });
    return stdout;
  } catch {
    return undefined;
  }
}
