import type { Config, OwnedFile, Suggestion } from "../types.js";
import { parentFolder } from "../utils/path.js";

export function generateSuggestions(files: OwnedFile[], config: Config): Suggestion[] {
  if (!config.suggestions.enabled || config.suggestions.maxRules === 0) {
    return [];
  }

  const owner = config.suggestions.preferredOwners[0] ?? "@TODO-owner";
  const unowned = files.filter((file) => file.status !== "owned");
  const grouped = new Map<string, number>();

  for (const file of unowned) {
    const folder = suggestionFolder(file.path);
    grouped.set(folder, (grouped.get(folder) ?? 0) + 1);
  }

  return [...grouped.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, config.suggestions.maxRules)
    .map(([folder, count]) => ({
      path: folder === "." ? "*" : `/${folder}/`,
      owners: [owner],
      reason: `${count} unowned ${count === 1 ? "file" : "files"} need human-reviewed ownership.`
    }));
}

function suggestionFolder(filePath: string): string {
  const folder = parentFolder(filePath);
  if (folder === ".") {
    return ".";
  }

  const parts = folder.split("/");
  if (parts.length <= 2) {
    return folder;
  }

  if (["apps", "packages", "services"].includes(parts[0] ?? "")) {
    return parts.slice(0, 2).join("/");
  }

  return parts[0] ?? folder;
}
