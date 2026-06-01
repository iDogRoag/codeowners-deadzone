import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeRepository } from "../src/codeowners/analyzer.js";
import { defaultConfig } from "../src/config.js";

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

describe("analyzer", () => {
  it("counts unowned and explicitly unowned files", async () => {
    const result = await analyzeRepository({ repoPath: path.join(fixtures, "ownerless"), config: defaultConfig() });
    expect(result.files.find((file) => file.path === "apps/github/index.ts")?.status).toBe("explicitly-unowned");
    expect(result.summary.explicitlyUnownedFiles).toBeGreaterThan(0);
  });

  it("fails unowned policy for explicit ownerless clears", async () => {
    const config = { ...defaultConfig(), failOn: ["unowned" as const] };
    const result = await analyzeRepository({ repoPath: path.join(fixtures, "ownerless"), config });
    expect(result.status).toBe("fail");
  });

  it("passes by default when only low findings remain", async () => {
    const result = await analyzeRepository({ repoPath: path.join(fixtures, "basic"), config: defaultConfig() });
    expect(result.findings.every((finding) => finding.severity === "low")).toBe(true);
    expect(result.status).toBe("pass");
  });

  it("detects coverage and important unowned findings", async () => {
    const result = await analyzeRepository({ repoPath: path.join(fixtures, "case-sensitive"), config: defaultConfig() });
    expect(result.files.find((file) => file.path === "docs/readme.md")?.status).toBe("unowned");
    expect(result.findings.some((finding) => finding.id.startsWith("coverage.unowned"))).toBe(true);
  });

  it("detects fully shadowed and unused rules", async () => {
    const result = await analyzeRepository({ repoPath: path.join(fixtures, "shadowed"), config: defaultConfig() });
    expect(result.rules.some((rule) => rule.health === "fully-shadowed")).toBe(true);
  });

  it("reports monorepo app-level coverage", async () => {
    const result = await analyzeRepository({ repoPath: path.join(fixtures, "monorepo"), config: defaultConfig() });
    expect(result.files.find((file) => file.path === "apps/web/src/index.ts")?.owners).toEqual(["@web-team"]);
    expect(result.files.find((file) => file.path === "services/billing/main.go")?.owners).toEqual(["@global"]);
  });
});
