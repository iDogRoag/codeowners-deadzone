import path from "node:path";
import { fileURLToPath } from "node:url";
import { findActiveCodeowners } from "../src/codeowners/locations.js";

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

describe("active CODEOWNERS location", () => {
  it(".github/CODEOWNERS wins over root and docs", async () => {
    const location = await findActiveCodeowners(path.join(fixtures, "active-location"));
    expect(location.activePath).toBe(".github/CODEOWNERS");
    expect(location.ignoredPaths).toEqual(["CODEOWNERS", "docs/CODEOWNERS"]);
  });

  it("reports missing CODEOWNERS", async () => {
    const location = await findActiveCodeowners(path.join(fixtures, "case-sensitive"));
    expect(location.activePath).toBe("CODEOWNERS");
    expect(location.missing).toBe(false);
  });
});
