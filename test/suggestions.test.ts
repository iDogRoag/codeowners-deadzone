import { generateSuggestions } from "../src/codeowners/suggestions.js";
import { defaultConfig } from "../src/config.js";
import type { OwnedFile } from "../src/types.js";

describe("suggestions", () => {
  it("groups unowned files by practical folders", () => {
    const files = [
      { path: "apps/web/src/index.ts", status: "unowned" },
      { path: "apps/web/src/page.ts", status: "unowned" },
      { path: "packages/ui/button.ts", status: "unowned" }
    ].map((item) => ({
      ...item,
      owners: [],
      matchingRules: [],
      important: true,
      weight: 3,
      fromFallback: false
    })) as OwnedFile[];
    const suggestions = generateSuggestions(files, defaultConfig());
    expect(suggestions[0]?.path).toBe("/apps/web/");
  });
});
