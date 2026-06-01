import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { ChangedFilesOptions } from "../types.js";
import { toPosixPath } from "../utils/path.js";

const execFileAsync = promisify(execFile);

export async function changedFiles(options: ChangedFilesOptions): Promise<string[]> {
  const base = options.base ?? "origin/main";
  const head = options.head;
  const { stdout } = await execFileAsync("git", ["diff", "--name-only", `${base}...${head}`], {
    cwd: options.repoPath,
    maxBuffer: 1024 * 1024 * 50
  });

  return stdout
    .split(/\r?\n/)
    .map((line) => toPosixPath(line.trim()))
    .filter(Boolean)
    .sort();
}
