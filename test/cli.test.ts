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

  it("rejects invalid format and numeric options", async () => {
    let stderr = "";
    const formatCode = await run(["node", "codz", "--format", "banana", "scan", path.join(fixtures, "basic")], {
      stdout: () => undefined,
      stderr: (value) => {
        stderr += value;
      }
    });
    expect(formatCode).toBe(2);
    expect(stderr).toContain("Allowed choices");

    stderr = "";
    const percentCode = await run(["node", "codz", "--min-coverage", "nope", "scan", path.join(fixtures, "basic")], {
      stdout: () => undefined,
      stderr: (value) => {
        stderr += value;
      }
    });
    expect(percentCode).toBe(2);
    expect(stderr).toContain("must be a number from 0 to 100");
  });

  it("supports strict status for low findings", async () => {
    let stdout = "";
    const code = await run(["node", "codz", "--format", "json", "--strict", "scan", path.join(fixtures, "basic")], {
      stdout: (value) => {
        stdout += value;
      },
      stderr: () => undefined
    });
    expect(code).toBe(0);
    expect(JSON.parse(stdout).status).toBe("warn");
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
