import { parseCodeowners } from "../src/codeowners/parser.js";
import { ownershipForFile } from "../src/codeowners/matcher.js";

describe("matcher", () => {
  it("uses last matching rule", () => {
    const parsed = parseCodeowners("* @global\n*.md @docs", "CODEOWNERS");
    const file = ownershipForFile("README.md", parsed.rules, true, 3);
    expect(file.status).toBe("owned");
    expect(file.owners).toEqual(["@docs"]);
    expect(file.matchingRules.map((rule) => rule.lineNumber)).toEqual([1, 2]);
  });

  it("lets ownerless final rules clear ownership", () => {
    const parsed = parseCodeowners("* @global\napps/github/", "CODEOWNERS");
    const file = ownershipForFile("apps/github/index.ts", parsed.rules, true, 3);
    expect(file.status).toBe("explicitly-unowned");
    expect(file.owners).toEqual([]);
  });
});
