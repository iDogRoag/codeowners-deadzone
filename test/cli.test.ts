import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
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

  it("runs demo through both binary names", async () => {
    let stdout = "";
    const longCode = await run(["node", "codeowners-deadzone", "demo"], {
      stdout: (value) => {
        stdout += value;
      },
      stderr: () => undefined
    });
    expect(longCode).toBe(0);
    expect(stdout).toContain("CODEOWNERS Dead Zone Finder");

    stdout = "";
    const aliasCode = await run(["node", "codz", "demo"], {
      stdout: (value) => {
        stdout += value;
      },
      stderr: () => undefined
    });
    expect(aliasCode).toBe(0);
    expect(stdout).toContain("Top dead zones");
  });

  it("renders demo JSON, Markdown, and HTML output", async () => {
    let stdout = "";
    const jsonCode = await run(["node", "codz", "demo", "--format", "json"], {
      stdout: (value) => {
        stdout += value;
      },
      stderr: () => undefined
    });
    expect(jsonCode).toBe(0);
    expect(JSON.parse(stdout).summary.totalFiles).toBeGreaterThan(0);

    stdout = "";
    const markdownCode = await run(["node", "codz", "demo", "--format", "markdown"], {
      stdout: (value) => {
        stdout += value;
      },
      stderr: () => undefined
    });
    expect(markdownCode).toBe(0);
    expect(stdout).toContain("# CODEOWNERS Dead Zone Report");

    const temp = await mkdtemp(path.join(os.tmpdir(), "codz-html-"));
    const output = path.join(temp, "demo.html");
    const htmlCode = await run(["node", "codz", "demo", "--format", "html", "--output", output], {
      stdout: () => undefined,
      stderr: () => undefined
    });
    expect(htmlCode).toBe(0);
    expect(await readFile(output, "utf8")).toContain("<!doctype html>");
  });

  it("prints badge Markdown and includes badge data in JSON", async () => {
    let stdout = "";
    const tableCode = await run(["node", "codz", "demo", "--badge"], {
      stdout: (value) => {
        stdout += value;
      },
      stderr: () => undefined
    });
    expect(tableCode).toBe(0);
    expect(stdout).toContain("![codeowners coverage]");

    stdout = "";
    const jsonCode = await run(["node", "codz", "demo", "--format", "json", "--badge"], {
      stdout: (value) => {
        stdout += value;
      },
      stderr: () => undefined
    });
    expect(jsonCode).toBe(0);
    expect(JSON.parse(stdout).badge.markdown).toContain("img.shields.io");
  });

  it("handles missing CODEOWNERS usefully", async () => {
    let stdout = "";
    const defaultCode = await run(["node", "codz", "scan", path.join(fixtures, "missing")], {
      stdout: (value) => {
        stdout += value;
      },
      stderr: () => undefined
    });
    expect(defaultCode).toBe(0);
    expect(stdout).toContain("No CODEOWNERS file found.");
    expect(stdout).toContain("Try codeowners-deadzone demo");

    stdout = "";
    const failCode = await run(["node", "codz", "scan", path.join(fixtures, "missing"), "--fail-on", "high"], {
      stdout: (value) => {
        stdout += value;
      },
      stderr: () => undefined
    });
    expect(failCode).toBe(1);
  });

  it("limits default terminal findings to the top five", async () => {
    let stdout = "";
    const code = await run(["node", "codz", "demo"], {
      stdout: (value) => {
        stdout += value;
      },
      stderr: () => undefined
    });
    expect(code).toBe(0);
    expect(stdout).toContain("Showing top 5 findings.");
    expect(stdout).toContain("Use --format markdown, --show-files, or --show-rules for details.");
  });
});
