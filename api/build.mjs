import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";
import { rm } from "node:fs/promises";
import { external, banner } from "./esbuild-shared.mjs";

// Some plugins, like esbuild-plugin-pino, need require to find things.
globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));

async function buildAll() {
  const distDir = path.resolve(artifactDir, "dist");
  await rm(distDir, { recursive: true, force: true });

  await esbuild({
    // Keep this outside api/ and as plain JS. Vercel misreads TS files in there (see README).
    // Named here, not as an array entry, so esbuild doesn't double up the .mjs extension.
    entryPoints: { "dev-server": path.resolve(artifactDir, "..", "dev-server.mjs") },
    platform: "node",
    bundle: true,
    format: "esm",
    outdir: distDir,
    outExtension: { ".js": ".mjs" },
    logLevel: "info",
    external,
    sourcemap: "linked",
    plugins: [
      // pino needs its worker files, so we use this plugin instead of externalizing it.
      esbuildPluginPino({ transports: ["pino-pretty"] })
    ],
    banner,
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
