import { parseCodeowners } from "../src/codeowners/parser.js";

describe("parser", () => {
  it("parses owners, comments, inline comments, and ownerless rules", () => {
    const parsed = parseCodeowners(
      `
# comment
* @global
docs/ @docs-team # docs owner
generated/
`,
      "CODEOWNERS"
    );

    expect(parsed.rules.filter((rule) => rule.isValid)).toHaveLength(3);
    expect(parsed.rules[1]?.inlineComment).toBe("# docs owner");
    expect(parsed.rules[2]?.isOwnerless).toBe(true);
  });

  it("reports unsupported syntax and invalid owners", () => {
    const parsed = parseCodeowners(
      `
!secret/** @security
src/[abc].ts @team
src/** nope
\\#literal @docs
@owner
user@example.com
`,
      "CODEOWNERS"
    );

    expect(parsed.invalidLines.map((line) => line.reason)).toEqual([
      "GitHub CODEOWNERS does not support ! negation.",
      "GitHub CODEOWNERS does not support [] character ranges.",
      "Invalid owner token: nope",
      "GitHub CODEOWNERS does not support escaping a leading # pattern.",
      "Line appears to contain owners but no pattern.",
      "Line appears to contain owners but no pattern."
    ]);
  });

  it("accepts usernames, teams, and email owners", () => {
    const parsed = parseCodeowners("src/ @octocat @org/team-name user@example.com", "CODEOWNERS");
    expect(parsed.invalidLines).toHaveLength(0);
    expect(parsed.rules[0]?.owners).toEqual(["@octocat", "@org/team-name", "user@example.com"]);
  });
});
