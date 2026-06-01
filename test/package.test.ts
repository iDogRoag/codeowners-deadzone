import { access, readFile } from "node:fs/promises";
import path from "node:path";

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
});
