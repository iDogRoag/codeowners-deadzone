import { matchCodeownersPattern } from "../src/codeowners/pattern.js";

describe("CODEOWNERS pattern matching", () => {
  it("matches fallback and nested extension patterns", () => {
    expect(matchCodeownersPattern("*", "src/app.ts")).toBe(true);
    expect(matchCodeownersPattern("*.js", "src/nested/app.js")).toBe(true);
  });

  it("handles one-level and recursive directory rules", () => {
    expect(matchCodeownersPattern("docs/*", "docs/file.md")).toBe(true);
    expect(matchCodeownersPattern("docs/*", "docs/nested/file.md")).toBe(false);
    expect(matchCodeownersPattern("/docs/", "docs/nested/file.md")).toBe(true);
    expect(matchCodeownersPattern("apps/", "packages/apps/index.ts")).toBe(true);
    expect(matchCodeownersPattern("**/logs", "services/api/logs")).toBe(true);
    expect(matchCodeownersPattern("**/logs/", "services/api/logs/today.txt")).toBe(true);
    expect(matchCodeownersPattern("/build/logs/", "build/logs/today.txt")).toBe(true);
    expect(matchCodeownersPattern("/build/logs/", "tmp/build/logs/today.txt")).toBe(false);
  });

  it("is case sensitive", () => {
    expect(matchCodeownersPattern("README.md", "README.md")).toBe(true);
    expect(matchCodeownersPattern("README.md", "readme.md")).toBe(false);
  });
});
