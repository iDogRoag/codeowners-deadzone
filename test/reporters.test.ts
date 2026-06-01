import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeRepository } from "../src/codeowners/analyzer.js";
import { defaultConfig } from "../src/config.js";
import { jsonReport } from "../src/reporters/json.js";
import { markdownReport } from "../src/reporters/markdown.js";
import { htmlReport } from "../src/reporters/html.js";
import { tableReport } from "../src/reporters/table.js";
import { sarifReport } from "../src/reporters/sarif.js";

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

describe("reporters", () => {
  it("renders JSON, Markdown, HTML, table, and SARIF reports", async () => {
    const result = await analyzeRepository({ repoPath: path.join(fixtures, "basic"), config: defaultConfig() });
    expect(JSON.parse(jsonReport(result)).schemaVersion).toBe(1);
    expect(markdownReport(result)).toContain("| Field | Value |");
    expect(htmlReport(result)).toContain("<!doctype html>");
    expect(tableReport(result)).toContain("Coverage");
    expect(JSON.parse(sarifReport(result)).version).toBe("2.1.0");
  });
});
