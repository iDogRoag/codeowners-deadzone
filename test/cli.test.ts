import path from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "../src/cli.js";

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

describe("cli", () => {
  it("prints help", async () => {
    let stdout = "";
    const code = await run(["node", "codz", "--help"], {
      stdout: (value) => {
        stdout += value;
      },
      stderr: () => undefined
    });
    expect(code).toBe(0);
    expect(stdout).toContain("codeowners-deadzone");
  });

  it("scans a fixture as JSON", async () => {
    let stdout = "";
    const code = await run(["node", "codz", "--format", "json", "scan", path.join(fixtures, "basic")], {
      stdout: (value) => {
        stdout += value;
      },
      stderr: () => undefined
    });
    expect(code).toBe(0);
    expect(JSON.parse(stdout).schemaVersion).toBe(1);
  });

  it("explains a fixture file", async () => {
    let stdout = "";
    const code = await run(["node", "codz", "explain", "src/app.ts", path.join(fixtures, "basic")], {
      stdout: (value) => {
        stdout += value;
      },
      stderr: () => undefined
    });
    expect(code).toBe(0);
    expect(stdout).toContain("Final owner");
  });
});
