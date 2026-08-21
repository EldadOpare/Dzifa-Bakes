import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";
import { rm } from "node:fs/promises";
import { external, banner } from "./esbuild-shared.mjs";

// This was set because some plugins, like esbuild-plugin-pino, used require to find dependencies.
globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));

async function buildAll() {
  const distDir = path.resolve(artifactDir, "dist");
  await rm(distDir, { recursive: true, force: true });

  await esbuild({
    // This lived outside api/ and as plain JS, not TS, on purpose. Something
    // in Vercel's build pipeline was independently type-checking every .ts
    // file it found (even outside api/, even underscore-prefixed ones)
    // against settings that did not match our own tsconfigs, so the
    // local-only dev server could not be a .ts file anywhere in the repo.
    // Named explicitly (rather than as an array entry) because esbuild only
    // strips recognized TS-style extensions when deriving an output name
    // from an outdir entry point; left alone, a ".mjs" input produced a
    // double-extensioned "dev-server..mjs" once outExtension appended its
    // own ".mjs".
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
      // This plugin was used instead of externalizing pino, since pino needed worker files to log.
      esbuildPluginPino({ transports: ["pino-pretty"] })
    ],
    banner,
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
