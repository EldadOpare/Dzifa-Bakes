// Runs only during Vercel's build, never locally. Bundles the real app into
// plain JS and deletes the TypeScript source so Vercel's function builder
// never gets to misread it. Don't rename or move api/index.mjs, see README.
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";
import { rm } from "node:fs/promises";
import { external, banner } from "./esbuild-shared.mjs";

globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  // Underscore prefix keeps Vercel from routing to this folder.
  const runtimeDir = path.resolve(artifactDir, "_runtime");
  await rm(runtimeDir, { recursive: true, force: true });

  await esbuild({
    entryPoints: { index: path.resolve(artifactDir, "_src", "app.ts") },
    platform: "node",
    bundle: true,
    format: "esm",
    outdir: runtimeDir,
    outExtension: { ".js": ".mjs" },
    logLevel: "info",
    external,
    sourcemap: "linked",
    plugins: [esbuildPluginPino({ transports: ["pino-pretty"] })],
    banner,
  });

  await rm(path.resolve(artifactDir, "_src"), { recursive: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
