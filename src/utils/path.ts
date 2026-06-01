import path from "node:path";

export function toPosixPath(value: string): string {
  return value.replace(/\\/g, "/").replace(/\/+/g, "/");
}

export function normalizeRepoRelativePath(repoPath: string, filePath: string): string {
  const relative = path.isAbsolute(filePath) ? path.relative(repoPath, filePath) : filePath;
  return toPosixPath(relative).replace(/^\.\//, "");
}

export function absoluteFrom(repoPath: string, filePath: string): string {
  return path.isAbsolute(filePath) ? filePath : path.join(repoPath, filePath);
}

export function topLevelFolder(filePath: string): string {
  const normalized = toPosixPath(filePath);
  const first = normalized.split("/")[0];
  return first && first.length > 0 ? first : ".";
}

export function parentFolder(filePath: string): string {
  const normalized = toPosixPath(filePath);
  const index = normalized.lastIndexOf("/");
  if (index === -1) {
    return ".";
  }
  return normalized.slice(0, index);
}
