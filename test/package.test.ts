import { access, mkdtemp, readFile, symlink } from "node:fs/promises";
import { execFile } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

describe("package build outputs", () => {
  it("keeps the shebang on the CLI entry only", async () => {
    const cliPath = path.join(process.cwd(), "dist/cli.js");
    const indexPath = path.join(process.cwd(), "dist/index.js");
    try {
      await access(cliPath);
      await access(indexPath);
    } catch {
      return;
    }

    const cli = await readFile(cliPath, "utf8");
    const index = await readFile(indexPath, "utf8");

    expect(cli.startsWith("#!/usr/bin/env node")).toBe(true);
    expect(index.startsWith("#!/usr/bin/env node")).toBe(false);
  });

  it("starts when executed through an npm-style bin symlink", async () => {
    const cliPath = path.join(process.cwd(), "dist/cli.js");
    try {
      await access(cliPath);
    } catch {
      return;
    }

    const temp = await mkdtemp(path.join(os.tmpdir(), "codz-bin-"));
    const binPath = path.join(temp, "codeowners-deadzone");
    await symlink(cliPath, binPath);

    const { stdout } = await execFileAsync(binPath, ["--help"], { cwd: process.cwd() });
    expect(stdout).toContain("Usage: codeowners-deadzone");
    expect(stdout).toContain("demo");
  });
});
