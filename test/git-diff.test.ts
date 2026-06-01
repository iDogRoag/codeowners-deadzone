import { execFile } from "node:child_process";
import { cp, mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { changedFiles } from "../src/git/diff.js";

const execFileAsync = promisify(execFile);
const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

describe("git diff", () => {
  it("lists changed files", async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "codz-git-"));
    await cp(path.join(fixtures, "changed"), temp, { recursive: true });
    await execFileAsync("git", ["init", "-b", "main"], { cwd: temp });
    await execFileAsync("git", ["config", "user.email", "test@example.com"], { cwd: temp });
    await execFileAsync("git", ["config", "user.name", "Test"], { cwd: temp });
    await execFileAsync("git", ["add", "."], { cwd: temp });
    await execFileAsync("git", ["commit", "-m", "initial"], { cwd: temp });
    await execFileAsync("git", ["checkout", "-b", "feature"], { cwd: temp });
    await execFileAsync("node", ["-e", "require('fs').appendFileSync('src/b.ts', '\\nexport const changed = true;\\n')"], { cwd: temp });
    await execFileAsync("git", ["add", "src/b.ts"], { cwd: temp });
    await execFileAsync("git", ["commit", "-m", "change b"], { cwd: temp });
    const files = await changedFiles({ repoPath: temp, base: "main", head: "HEAD" });
    expect(files).toEqual(["src/b.ts"]);
  });
});
