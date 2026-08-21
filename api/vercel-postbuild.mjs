// Runs only as part of vercel.json's buildCommand, never locally: it bundles
// the real Express app into plain JS and then deletes the TypeScript sources
// from this (ephemeral, freshly-cloned) Vercel build sandbox. This never
// touches the actual git repo.
//
// Why: across several rounds, Vercel's own build pipeline kept independently
// compiling whatever .ts file sat under api/ (or, once, even outside it)
// against settings that never matched either of our tsconfigs, no matter
// where the file lived or whether it was underscore-prefixed. The only
// reliable fix was to leave nothing under api/ for it to misinterpret: by
// the time Vercel's function builder runs, api/ contains only bundled JS.
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";
import { rm, writeFile } from "node:fs/promises";
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
    entryPoints: { index: path.resolve(artifactDir, "index.ts") },
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

  await rm(path.resolve(artifactDir, "index.ts"));
  await rm(path.resolve(artifactDir, "_src"), { recursive: true });

  // Thin plain-JS shim: this is the file Vercel actually routes to. It has
  // no imports it needs to resolve at build time beyond a single relative
  // re-export, so there is nothing left for a mismatched type-checker to
  // trip on.
  await writeFile(
    path.resolve(artifactDir, "index.mjs"),
    'export { default } from "./_runtime/index.mjs";\n',
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
