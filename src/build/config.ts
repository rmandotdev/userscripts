import * as path from "path";

type UserscriptVersion =
  | `${0}.${number}`
  | `${number}.${0}`
  | `${number}.${number}.${number}`
  | `${number}.${number}.${number}.${string}`;

export type HeaderConfig = {
  name: string;
  match: string | string[];
  description: string;
  version: UserscriptVersion;

  downloadURL?: string;
  updateURL?: string;

  namespace?: string;
  author?: string;
  supportURL?: string;
  homepageURL?: string;
  license?: string;
} & Partial<{
  grant: string[];
  icon?: string;
  runAt: VMScriptRunAt | "";
}>;

const defaultHeader: Partial<HeaderConfig> = {
  namespace: "rman.dev",
  author: "GameRoMan",
  supportURL: "https://rman.dev/discord",
  homepageURL: "https://rman.dev/discord",
  license: "MIT",
};

export function defineConfig(config: { headers: HeaderConfig }): HeaderConfig {
  return config.headers;
}

export function inferHeaderFields(
  scriptDir: string,
  rootDir: string,
): Partial<HeaderConfig> {
  const baseURL = "https://userscripts.rman.dev";
  if (!scriptDir.startsWith(rootDir)) {
    throw new Error("scriptDir must be a subdirectory of rootDir");
  }
  const relativePath = path.relative(rootDir, scriptDir).replace(/\\/g, "/");
  const scriptPath = relativePath
    ? `${relativePath}/index.user.js`
    : "index.user.js";
  return {
    downloadURL: `${baseURL}/${scriptPath}`,
    updateURL: `${baseURL}/${scriptPath}`,
  };
}

export function serializeHeader(
  config: HeaderConfig,
  opts?: { scriptDir?: string; rootDir?: string },
): { finalConfig: HeaderConfig; serializedHeader: string } {
  const inferred =
    opts?.scriptDir && opts?.rootDir
      ? inferHeaderFields(opts.scriptDir, opts.rootDir)
      : {};

  const finalConfig: HeaderConfig = {
    ...defaultHeader,
    ...inferred,
    ...config,
  };

  const lines = ["// ==UserScript=="];
  for (const [key, val] of Object.entries(finalConfig)) {
    if (val === undefined) continue;
    if (Array.isArray(val)) {
      for (const v of val) {
        lines.push(`// @${key.padEnd(15)} ${v}`);
      }
    } else {
      lines.push(`// @${key.padEnd(15)} ${val}`);
    }
  }
  lines.push("// ==/UserScript==\n");
  const serializedHeader = lines.join("\n");
  return { finalConfig, serializedHeader };
}
