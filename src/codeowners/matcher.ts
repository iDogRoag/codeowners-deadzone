import type { CodeownersRule, MatchedRule, OwnedFile, OwnershipStatus } from "../types.js";
import { isFallbackPattern, matchCodeownersPattern } from "./pattern.js";

export function matchingRulesForFile(filePath: string, rules: CodeownersRule[]): MatchedRule[] {
  return rules
    .filter((rule) => rule.isValid && matchCodeownersPattern(rule.normalizedPattern, filePath))
    .map((rule) => ({
      lineNumber: rule.lineNumber,
      pattern: rule.pattern,
      owners: rule.owners,
      isOwnerless: rule.isOwnerless
    }));
}

export function ownershipForFile(
  filePath: string,
  rules: CodeownersRule[],
  important: boolean,
  weight: number
): OwnedFile {
  const matches = matchingRulesForFile(filePath, rules);
  const finalRule = matches.at(-1);
  const status: OwnershipStatus = !finalRule
    ? "unowned"
    : finalRule.isOwnerless
      ? "explicitly-unowned"
      : "owned";

  return {
    path: filePath,
    status,
    owners: finalRule?.owners ?? [],
    finalRule,
    matchingRules: matches,
    important,
    weight,
    fromFallback: finalRule ? isFallbackPattern(finalRule.pattern) : false
  };
}
