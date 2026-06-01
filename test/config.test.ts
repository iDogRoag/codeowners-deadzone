import { defaultConfig, mergeCliConfig } from "../src/config.js";

describe("config", () => {
  it("has safe defaults", () => {
    const config = defaultConfig();
    expect(config.version).toBe(1);
    expect(config.minCoverage).toBe(90);
    expect(config.exclude).toContain("node_modules/**");
  });

  it("merges CLI options", () => {
    const config = mergeCliConfig(defaultConfig(), {
      include: ["src/**"],
      exclude: ["generated/**"],
      minCoverage: 95,
      failOn: "high"
    });
    expect(config.include).toEqual(["src/**"]);
    expect(config.exclude).toContain("generated/**");
    expect(config.minCoverage).toBe(95);
    expect(config.failOn).toEqual(["high"]);
  });
});
