import { chmod, readFile, writeFile } from "node:fs/promises";
import { URL } from "node:url";

const cliPath = new URL("../dist/cli.js", import.meta.url);
const shebang = "#!/usr/bin/env node\n";
const content = await readFile(cliPath, "utf8");

if (!content.startsWith(shebang)) {
  await writeFile(cliPath, `${shebang}${content}`, "utf8");
}

await chmod(cliPath, 0o755);
