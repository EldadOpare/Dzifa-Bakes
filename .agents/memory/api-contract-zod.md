---
name: API contract numeric fields
description: OpenAPI integer fields currently generate unsupported zod.int helpers in this workspace.
---

Use `type: number` for numeric API contract fields that do not require runtime integer validation; the generated client and server types still communicate numeric values without breaking the workspace's Zod 3 validation package.

**Why:** The current codegen output targets a newer Zod API than the installed package exposes, so integer schemas fail `typecheck:libs`.

**How to apply:** When authoring OpenAPI for this workspace, prefer numeric fields unless integer-specific validation is essential and the Zod/toolchain versions have been aligned.