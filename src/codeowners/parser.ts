import type { CodeownersRule, ParsedCodeownersFile } from "../types.js";

const USER_RE = /^@[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
const TEAM_RE = /^@[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseCodeowners(content: string, filePath: string, sizeBytes?: number): ParsedCodeownersFile {
  const lines = content.split(/\r?\n/);
  const rules: CodeownersRule[] = [];
  const invalidLines = [];
  const warnings: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    const rawLine = lines[index] ?? "";
    const trimmed = rawLine.trim();

    if (trimmed.length === 0) {
      continue;
    }

    if (trimmed.startsWith("#")) {
      continue;
    }

    if (trimmed.startsWith("\\#")) {
      invalidLines.push({
        lineNumber,
        rawLine,
        reason: "GitHub CODEOWNERS does not support escaping a leading # pattern."
      });
      continue;
    }

    const tokenized = tokenizeLine(rawLine);
    if (tokenized.tokens.length === 0) {
      continue;
    }

    const [patternToken, ...owners] = tokenized.tokens;
    const pattern = patternToken ?? "";
    const invalidReason = validateRule(pattern, owners);

    if (invalidReason) {
      invalidLines.push({ lineNumber, rawLine, reason: invalidReason });
      rules.push(makeRule(lineNumber, rawLine, pattern, owners, tokenized.inlineComment, false, invalidReason));
      continue;
    }

    if (tokenized.inlineComment && tokenized.inlineComment.includes("#")) {
      warnings.push(`Line ${lineNumber}: parsed inline comment after owners.`);
    }

    rules.push(makeRule(lineNumber, rawLine, pattern, owners, tokenized.inlineComment, true));
  }

  return {
    path: filePath,
    sizeBytes: sizeBytes ?? Buffer.byteLength(content, "utf8"),
    lines: lines.length,
    rules,
    invalidLines,
    warnings
  };
}

function makeRule(
  lineNumber: number,
  rawLine: string,
  pattern: string,
  owners: string[],
  inlineComment: string | undefined,
  isValid: boolean,
  invalidReason?: string
): CodeownersRule {
  return {
    lineNumber,
    rawLine,
    pattern,
    normalizedPattern: normalizePattern(pattern),
    owners,
    inlineComment,
    isComment: false,
    isBlank: false,
    hasOwners: owners.length > 0,
    isOwnerless: owners.length === 0,
    isValid,
    invalidReason
  };
}

function tokenizeLine(line: string): { tokens: string[]; inlineComment?: string } {
  const tokens: string[] = [];
  let current = "";
  let escaped = false;
  let sawWhitespace = true;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index] ?? "";

    if (escaped) {
      current += char === " " ? " " : `\\${char}`;
      escaped = false;
      sawWhitespace = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === "#" && sawWhitespace) {
      if (current.length > 0) {
        tokens.push(current);
      }
      return { tokens, inlineComment: line.slice(index).trim() };
    }

    if (/\s/.test(char)) {
      if (current.length > 0) {
        tokens.push(current);
        current = "";
      }
      sawWhitespace = true;
      continue;
    }

    current += char;
    sawWhitespace = false;
  }

  if (escaped) {
    current += "\\";
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return { tokens };
}

function validateRule(pattern: string, owners: string[]): string | undefined {
  if (!pattern) {
    return "Missing pattern.";
  }
  if (looksLikeOwner(pattern)) {
    return "Line appears to contain owners but no pattern.";
  }
  if (pattern.startsWith("!")) {
    return "GitHub CODEOWNERS does not support ! negation.";
  }
  if (pattern.includes("[") || pattern.includes("]")) {
    return "GitHub CODEOWNERS does not support [] character ranges.";
  }
  for (const owner of owners) {
    if (!isValidOwner(owner)) {
      return `Invalid owner token: ${owner}`;
    }
  }
  return undefined;
}

function isValidOwner(owner: string): boolean {
  return USER_RE.test(owner) || TEAM_RE.test(owner) || EMAIL_RE.test(owner);
}

function looksLikeOwner(token: string): boolean {
  return token.startsWith("@") || EMAIL_RE.test(token);
}

function normalizePattern(pattern: string): string {
  return pattern.replace(/\\/g, "/").replace(/\/+/g, "/");
}
