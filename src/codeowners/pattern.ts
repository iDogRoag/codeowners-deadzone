import { toPosixPath } from "../utils/path.js";

export function matchCodeownersPattern(pattern: string, filePath: string): boolean {
  const normalizedPath = toPosixPath(filePath).replace(/^\.\//, "");
  const normalizedPattern = normalizePattern(pattern);

  if (!normalizedPattern || normalizedPath.length === 0) {
    return false;
  }

  const rooted = normalizedPattern.startsWith("/");
  const directoryPattern = normalizedPattern.endsWith("/");
  const core = normalizedPattern.replace(/^\/+/, "").replace(/\/+$/, "");
  const pathSegments = normalizedPath.split("/");
  const patternSegments = core.split("/").filter(Boolean);

  if (patternSegments.length === 0) {
    return false;
  }

  if (directoryPattern) {
    return matchDirectoryPattern(patternSegments, pathSegments, rooted);
  }

  const hasSlash = patternSegments.length > 1 || rooted;
  if (hasSlash) {
    return matchSegments(patternSegments, pathSegments);
  }

  return pathSegments.some((segment) => matchSegment(patternSegments[0] ?? "", segment));
}

export function isFallbackPattern(pattern: string): boolean {
  const normalized = normalizePattern(pattern);
  return normalized === "*" || normalized === "/*" || normalized === "**" || normalized === "/**";
}

function matchDirectoryPattern(patternSegments: string[], pathSegments: string[], rooted: boolean): boolean {
  if (pathSegments.length < 2) {
    return false;
  }

  for (let prefixLength = 1; prefixLength < pathSegments.length; prefixLength += 1) {
    const prefix = pathSegments.slice(0, prefixLength);
    if (rooted || patternSegments.length > 1) {
      if (matchSegments(patternSegments, prefix)) {
        return true;
      }
    } else if (prefix.some((segment) => matchSegment(patternSegments[0] ?? "", segment))) {
      return true;
    }
  }

  return false;
}

function normalizePattern(pattern: string): string {
  return pattern.replace(/\\/g, "/").replace(/\/+/g, "/");
}

function matchSegments(patternSegments: string[], pathSegments: string[]): boolean {
  const memo = new Map<string, boolean>();

  function walk(patternIndex: number, pathIndex: number): boolean {
    const key = `${patternIndex}:${pathIndex}`;
    const cached = memo.get(key);
    if (cached !== undefined) {
      return cached;
    }

    if (patternIndex === patternSegments.length) {
      const result = pathIndex === pathSegments.length;
      memo.set(key, result);
      return result;
    }

    const pattern = patternSegments[patternIndex] ?? "";
    if (pattern === "**") {
      if (walk(patternIndex + 1, pathIndex)) {
        memo.set(key, true);
        return true;
      }
      if (pathIndex < pathSegments.length && walk(patternIndex, pathIndex + 1)) {
        memo.set(key, true);
        return true;
      }
      memo.set(key, false);
      return false;
    }

    const result =
      pathIndex < pathSegments.length &&
      matchSegment(pattern, pathSegments[pathIndex] ?? "") &&
      walk(patternIndex + 1, pathIndex + 1);
    memo.set(key, result);
    return result;
  }

  return walk(0, 0);
}

function matchSegment(pattern: string, segment: string): boolean {
  let regex = "^";
  for (const char of pattern) {
    if (char === "*") {
      regex += "[^/]*";
    } else if (char === "?") {
      regex += "[^/]";
    } else {
      regex += escapeRegex(char);
    }
  }
  regex += "$";
  return new RegExp(regex).test(segment);
}

function escapeRegex(value: string): string {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}
