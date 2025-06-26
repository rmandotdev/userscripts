import { build } from "bun";
import * as path from "path";
import * as fs from "fs/promises";
import { pathToFileURL, fileURLToPath } from "url";
import { serializeHeader, type HeaderConfig } from "./config";

const SRC_USERSCRIPTS = fileURLToPath(new URL("../scripts/", import.meta.url));
const SRC_PUBLIC = fileURLToPath(new URL("../public/", import.meta.url));
const DIST = fileURLToPath(new URL("../../dist/", import.meta.url));

const CONFIG_FILE_NAME = "config.ts";

// Parse CLI args for --verbose flag
const verbose = process.argv.includes("--verbose");

function logVerbose(...args: any[]) {
  if (verbose) {
    console.log(...args);
  }
}

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

async function buildUserScript(dir: string) {
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

  const result = await build({
    entrypoints: [entryPoint],
    outdir: outDir,
    target: "browser",
    sourcemap: "none",
    format: "esm",
    minify: false,
    splitting: false,
    naming: { entry: "main.js" },
  });

  if (!result.success) {
    console.error(`❌ Build failed for ${entryPoint}`);
    return;
  }

  const bundledFile = path.join(outDir, "main.js");
  const bundledCode = await fs.readFile(bundledFile, "utf-8");

  const fullCode = `${header}\n${bundledCode}`;

  const finalFile = path.join(outDir, "index.user.js");
  await fs.writeFile(finalFile, fullCode, "utf-8");

  await fs.unlink(bundledFile);

  logVerbose(`✅ Built userscript: ${finalFile}`);
}

async function buildAll() {
  console.log("\n🧹 Cleaning dist directory...");
  await fs.rm(DIST, { recursive: true, force: true });

  console.log("\n📤 Copying public files...");
  await copyDir(SRC_PUBLIC, DIST);
  console.log("✅ Public files copied.");

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

  logVerbose(`\n🔍 Searching for userscripts in ${SRC_USERSCRIPTS}...`);
  const userscriptDirs = await findUserscriptDirs(SRC_USERSCRIPTS);
  if (userscriptDirs.length === 0) {
    console.warn(`⚠️ No userscripts found in ${SRC_USERSCRIPTS}`);
  } else {
    console.log(`🔎 Found ${userscriptDirs.length} userscript(s).`);
  }

  for (const dir of userscriptDirs) {
    await buildUserScript(dir);
  }

  console.log("\n🎉 Build process complete!");
}

buildAll().catch((e) => {
  console.error("\n❌ Error during build:");
  console.error(e);
  process.exit(1);
});
