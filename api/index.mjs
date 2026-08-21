// This is the actual Vercel function entry, committed as plain JS (not
// generated at build time). Vercel detects functions under api/ from the
// git checkout before running buildCommand, then builds the file it
// detected only after buildCommand finishes. A version of this file that
// only appeared as a build artifact got deleted/renamed out from under that
// second step, producing "File not found: api/index.ts". Keeping this exact
// path present at both stages, with only its target regenerated each build,
// avoids that. See api/vercel-postbuild.mjs, which produces ./_runtime/index.mjs.
export { default } from "./_runtime/index.mjs";
