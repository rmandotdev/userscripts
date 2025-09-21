import { build } from "bun";

import * as path from "path";
import * as fs from "fs/promises";

import { pathToFileURL, fileURLToPath } from "url";

import { serializeHeader, type HeaderConfig } from "./config";

const SRC_USERSCRIPTS = fileURLToPath(new URL("../scripts/", import.meta.url));
const SRC_PUBLIC = fileURLToPath(new URL("../public/", import.meta.url));
const DIST = fileURLToPath(new URL("../../dist/", import.meta.url));

const CONFIG_FILE_NAME = "userscript.config.ts";

// Parse CLI args for --verbose flag
const verbose = process.argv.includes("--verbose");

function logVerbose(...args: any[]) {
  if (verbose) {
    console.log(...args);
  }
}
const logNonVerbose = console.log;

async function copyDir(src: string, dest: string) {
  await fs.mkdir(dest, { recursive: true });
  for (const entry of await fs.readdir(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      logVerbose(`📁 Recursing into directory: ${srcPath}`);
      await copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      logVerbose(`📄 Copying file: ${srcPath} → ${destPath}`);
      await fs.copyFile(srcPath, destPath);
    } else if (entry.isSymbolicLink()) {
      const realPath = await fs.realpath(srcPath);
      const stat = await fs.stat(realPath);
      if (stat.isDirectory()) {
        logVerbose(
          `🔗 Recursing into symlinked directory: ${srcPath} → ${realPath}`
        );
        await copyDir(realPath, destPath);
      } else if (stat.isFile()) {
        logVerbose(`🔗 Copying symlinked file: ${srcPath} → ${destPath}`);
        await fs.copyFile(realPath, destPath);
      } else {
        logVerbose(`⚠️ Skipping unknown symlink target: ${srcPath}`);
      }
    } else {
      logVerbose(
        `⚠️ Skipping unknown entry (not file/dir/symlink): ${srcPath}`
      );
    }
  }
}

async function buildUserscript(dir: string): Promise<
  | {
      finalConfig: HeaderConfig;
      serializedHeader: string;
    }
  | undefined
> {
  const configPath = path.join(dir, CONFIG_FILE_NAME);
  const mainTSPath = (await fs.readdir(dir)).find(
    (f) => f.startsWith("index.") && (f.endsWith(".ts") || f.endsWith(".tsx"))
  );
  if (!mainTSPath) {
    console.warn(`⚠️ No index.ts[x] found in ${dir}, skipping`);
    return;
  }

  logVerbose(`🚧 Building userscript in: ${dir}`);

  // Import the header config (default export)
  const headerModule = await import(pathToFileURL(configPath).href);
  const headerConfig: HeaderConfig = headerModule.default;

  // Serialize header with scriptDir and rootDir
  const header = serializeHeader(headerConfig, {
    scriptDir: dir,
    rootDir: SRC_USERSCRIPTS,
  });

  const entryPoint = path.join(dir, mainTSPath);
  const outDir = path.join(DIST, path.relative(SRC_USERSCRIPTS, dir));

  await fs.mkdir(outDir, { recursive: true });

  const TEMP_MAIN_FILE_NAME = "main.js";

  const result = await build({
    entrypoints: [entryPoint],
    outdir: outDir,
    target: "browser",
    sourcemap: "none",
    format: "esm",
    minify: false,
    splitting: false,
    naming: { entry: TEMP_MAIN_FILE_NAME },
  });

  if (!result.success) {
    console.error(`❌ Build failed for ${entryPoint}`);
    return;
  }

  const bundledFile = path.join(outDir, TEMP_MAIN_FILE_NAME);
  const bundledCode = await fs.readFile(bundledFile, "utf-8");

  const fullCode = `${header.serializedHeader}\n${bundledCode}`;

  const USERSCRIPT_OUTPUT_FILE_NAME = "index.user.js";

  const finalFile = path.join(outDir, USERSCRIPT_OUTPUT_FILE_NAME);
  await fs.writeFile(finalFile, fullCode, "utf-8");

  const USERSCRIPT_META_FILE_NAME = "meta.json";

  const metaFile = path.join(outDir, USERSCRIPT_META_FILE_NAME);
  const meta = { headers: headerConfig };
  const stringifiedMeta = JSON.stringify(meta);
  await fs.writeFile(metaFile, stringifiedMeta, "utf-8");

  await fs.unlink(bundledFile);

  logVerbose(`✅ Built userscript: ${finalFile}`);

  return header;
}

async function findUserscriptDirs(dir: string): Promise<string[]> {
  let result: string[] = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result = result.concat(await findUserscriptDirs(fullPath));
    } else if (entry.name === CONFIG_FILE_NAME) {
      result.push(dir);
    }
  }
  return result;
}

async function buildUserscripts() {
  logVerbose(`🔍 Searching for userscripts in ${SRC_USERSCRIPTS}...`);
  const userscriptDirs = await findUserscriptDirs(SRC_USERSCRIPTS);
  if (userscriptDirs.length === 0) {
    console.warn(`⚠️ No userscripts found in ${SRC_USERSCRIPTS}`);
  } else {
    logNonVerbose(`🔎 Found ${userscriptDirs.length} userscripts.`);
  }

  const userscriptsMeta: {
    name: string;
    url?: string;
    version?: string;
  }[] = [];

  for (const dir of userscriptDirs) {
    const header = await buildUserscript(dir);
    if (header) {
      const cfg = header.finalConfig;
      userscriptsMeta.push({
        name: cfg.name,
        url: cfg.downloadURL || cfg.updateURL,
        version: cfg.version,
      });
    }
  }

  const metaDir = path.join(DIST, "_meta");
  await fs.mkdir(metaDir, { recursive: true });
  const metadata = { userscripts: userscriptsMeta };
  const stringifiedMeta = JSON.stringify(metadata);
  const userscriptsMetaFile = path.join(metaDir, "userscripts.json");
  await fs.writeFile(userscriptsMetaFile, stringifiedMeta, "utf-8");
}

async function buildAll() {
  // -- Cleaning dist directory --
  logNonVerbose("\n🧹 Cleaning dist directory...");
  await fs.rm(DIST, { recursive: true, force: true });

  // -- Copying public files --
  logNonVerbose("\n📤 Copying public files...");
  await copyDir(SRC_PUBLIC, DIST);
  logNonVerbose("✅ Public files copied.\n");

  // -- Building userscripts --
  await buildUserscripts();
  logNonVerbose(`✅ Built userscripts.`);

  logNonVerbose("\n🎉 Build process complete!");
}

buildAll().catch((e) => {
  console.error("\n❌ Error during build:");
  console.error(e);
  process.exit(1);
});
