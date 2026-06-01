import path from "node:path";
import { CODEOWNERS_LOCATIONS } from "../types.js";
import type { CodeownersLocation } from "../types.js";
import { fileSize, pathExists, readUtf8 } from "../utils/fs.js";
import { readFileFromRef } from "../git/files.js";

const MAX_CODEOWNERS_BYTES = 3 * 1024 * 1024;

export async function findActiveCodeowners(repoPath: string): Promise<CodeownersLocation> {
  const existing: string[] = [];
  for (const candidate of CODEOWNERS_LOCATIONS) {
    if (await pathExists(path.join(repoPath, candidate))) {
      existing.push(candidate);
    }
  }

  const activePath = existing[0];
  if (!activePath) {
    return {
      ignoredPaths: [],
      missing: true,
      sizeBytes: 0,
      lineCount: 0,
      oversized: false
    };
  }

  const absolute = path.join(repoPath, activePath);
  const sizeBytes = await fileSize(absolute);
  const content = await readUtf8(absolute);

  return {
    activePath,
    ignoredPaths: existing.slice(1),
    missing: false,
    sizeBytes,
    lineCount: content.split(/\r?\n/).length,
    oversized: sizeBytes > MAX_CODEOWNERS_BYTES
  };
}

export async function findActiveCodeownersFromGitRef(
  repoPath: string,
  ref: string
): Promise<{ location: CodeownersLocation; content?: string; warnings: string[] }> {
  const existing: Array<{ path: string; content: string }> = [];
  const warnings: string[] = [];

  for (const candidate of CODEOWNERS_LOCATIONS) {
    const content = await readFileFromRef(repoPath, ref, candidate);
    if (content !== undefined) {
      existing.push({ path: candidate, content });
    }
  }

  const active = existing[0];
  if (!active) {
    return {
      location: {
        ignoredPaths: [],
        missing: true,
        sizeBytes: 0,
        lineCount: 0,
        oversized: false
      },
      warnings
    };
  }

  const sizeBytes = Buffer.byteLength(active.content, "utf8");
  warnings.push(`changed mode is using CODEOWNERS from base ref ${ref}:${active.path}`);

  return {
    location: {
      activePath: active.path,
      ignoredPaths: existing.slice(1).map((item) => item.path),
      missing: false,
      sizeBytes,
      lineCount: active.content.split(/\r?\n/).length,
      oversized: sizeBytes > MAX_CODEOWNERS_BYTES
    },
    content: active.content,
    warnings
  };
}
