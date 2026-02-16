import { existsSync } from "node:fs";
import { join } from "node:path";

if (process.env.HUSKY === "0" || process.env.CI === "true") {
  process.exit(0);
}

const gitDir = join(process.cwd(), ".git");
if (!existsSync(gitDir)) {
  process.exit(0);
}

try {
  const husky = (await import("husky")).default;
  husky();
} catch (error) {
  const code = error && typeof error === "object" ? error.code : undefined;
  if (code === "ERR_MODULE_NOT_FOUND" || code === "MODULE_NOT_FOUND") {
    process.exit(0);
  }
  throw error;
}
