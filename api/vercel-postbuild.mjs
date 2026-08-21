// Runs only as part of vercel.json's buildCommand, never locally: it bundles
// the real Express app into plain JS at api/_runtime/index.mjs (which the
// committed api/index.mjs re-exports from) and then deletes the TypeScript
// sources from this (ephemeral, freshly-cloned) Vercel build sandbox. This
// never touches the actual git repo.
//
// Why: across several rounds, Vercel's own build pipeline kept independently
// compiling whatever .ts file sat under api/ (or, once, even outside it)
// against settings that never matched either of our tsconfigs, no matter
// where the file lived or whether it was underscore-prefixed. The only
// reliable fix was to leave nothing under api/ for it to misinterpret: by
// the time Vercel's function builder runs, api/ contains only bundled JS.
//
// api/index.mjs itself is committed source, not generated here: Vercel
// detects which files under api/ are functions from the git checkout before
// buildCommand runs, then builds/traces the detected file only after
// buildCommand finishes. A version of that file that only existed as a
// build artifact got deleted/renamed out from under that second step,
// producing "File not found: api/index.ts". Regenerating only its target
// (_runtime/index.mjs) and leaving the entry path itself alone avoids that.
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
  // Output lives under an underscore-prefixed folder so Vercel's routing
  // convention excludes it, matching pino's worker files as siblings of
  // index.mjs so their build-time-embedded relative paths keep resolving.
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
