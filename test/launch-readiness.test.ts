import { access, readFile } from "node:fs/promises";
import path from "node:path";

describe("launch readiness docs", () => {
  it("keeps the README launch promises visible", async () => {
    const readme = await readFile(path.join(process.cwd(), "README.md"), "utf8");

    expect(readme).toContain("npx codeowners-deadzone scan .");
    expect(readme).toContain("npx codeowners-deadzone demo");
    expect(readme).toContain("static offline CODEOWNERS coverage analyzer");
    expect(readme).toContain("does not call the GitHub API by default");
    expect(readme).toContain("Owner existence, team visibility, write access");
  });

  it("includes launch support files", async () => {
    const requiredFiles = [
      "LAUNCH.md",
      "docs/share-copy.md",
      "docs/repo-topics.md",
      "docs/good-first-issues.md",
      "docs/release-checklist.md"
    ];

    await Promise.all(requiredFiles.map((file) => access(path.join(process.cwd(), file))));
  });
});
