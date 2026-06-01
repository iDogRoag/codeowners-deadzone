import { access, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readUtf8(filePath: string): Promise<string> {
  return readFile(filePath, "utf8");
}

export async function writeUtf8(filePath: string, content: string): Promise<void> {
  await writeFile(filePath, content, "utf8");
}

export async function fileSize(filePath: string): Promise<number> {
  const info = await stat(filePath);
  return info.size;
}

export async function findFirstExisting(basePath: string, candidates: string[]): Promise<string | undefined> {
  for (const candidate of candidates) {
    const absolute = path.join(basePath, candidate);
    if (await pathExists(absolute)) {
      return candidate;
    }
  }
  return undefined;
}
