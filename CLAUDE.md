# CLAUDE.md

Guidance for AI coding agents working in this repository.

## Type-precision rule (load-bearing)

**The published API surface MUST NOT include `any` or `unknown` as a return type or argument type.** This applies to:

- **SDK endpoints** in `src/generated/sdk.gen.ts` — args and returns flow from `types.gen.ts` and should already be precise. If the generator ever emits `unknown`/`any` for an endpoint response or request body, fix it with a transform in `scripts/postgenerate.ts` (see the existing `fixTelemetryResponseTypes` for the pattern).
- **Zod schemas** in `src/generated/zod.gen.ts` — for every exported `zX`, `z.infer<typeof zX>` MUST resolve to the corresponding TS type `X` in `types.gen.ts`. Returning `any`/`unknown` from `.parse()` or `z.infer` is a regression.

When a Zod schema is deep enough to trip TS7056 ("inferred type exceeds serialization length") or TS2589 ("type instantiation excessively deep"), **do not escape to `z.ZodTypeAny`**. Annotate with `z.ZodType<TypeName>` and `import type { TypeName } from './types.gen'`. The annotation flattens the declared type without erasing it; add `// @ts-ignore TS2589` only on the assignment line if the assignability check itself blows up. See `scripts/postgenerate.ts:annotateComplexSchemas` for the canonical example.

## Codegen workflow

The client is generated from an OpenAPI spec — **do not edit files under `src/generated/**` directly**, they are overwritten by `pnpm generate`. Persistent fixes belong in one of two scripts:

- `scripts/patch-spec.ts` — modifies the OpenAPI spec before codegen runs. Use it for missing discriminator mappings, synthesizing absent schemas, or fixing upstream spec bugs.
- `scripts/postgenerate.ts` — string-rewrites the generated TS/Zod output. Use it for fixes that can't be expressed at the spec level (nullable optionals, response type corrections, explicit type annotations).

Both scripts are deliberately loud-failing: missing patch targets warn ("found 0 matches") or error out. Trust those signals when upstream shifts — if a patch becomes a no-op, decide whether upstream fixed it (remove the patch) or renamed something (update the patch). Never silently drop a patch.

Pipeline: `pnpm fetch-spec` → `pnpm generate` (runs patch-spec → openapi-ts → postgenerate) → `pnpm typecheck && pnpm test && pnpm lint && pnpm build`.

## Verifying SDK completeness against the TB Java source

TB's OpenAPI generator routinely drops information from the Java model. Every patch in `scripts/patch-spec.ts` exists because something a consumer needs is missing from upstream. Open TB-spec bugs we work around: thingsboard/thingsboard#15672 (discriminator gaps), #15673 (nullable optionals), #15674 (response/field typing). When adding or auditing a patch, two patterns have caught us before — check both.

### A. Polymorphic schemas with incomplete subtype coverage

TB uses Jackson `@JsonSubTypes` to model discriminated unions, but Springdoc often emits only one or two subtypes. Before patching a polymorphic parent:

1. Find the Java class — usually under `common/data/src/main/java/org/thingsboard/server/common/data/`. Fetch via `gh api repos/thingsboard/thingsboard/contents/<path>?ref=master --jq .download_url` then curl, or `https://raw.githubusercontent.com/thingsboard/thingsboard/master/<path>`.
2. Read its `@JsonSubTypes` / `@DiscriminatorMapping` — that's the ground truth of variants TB supports.
3. List what the SDK exposes today: `grep '^export type ' src/generated/types.gen.ts`.
4. Synthesize every missing variant, or document in the patch comment why it's deferred (e.g., depends on more schemas missing from spec; see how `GeofencingCalculatedFieldConfiguration` is currently deferred).

Canonical example: `CalculatedFieldConfiguration` ships 7 `@JsonSubTypes` (SIMPLE, SCRIPT, GEOFENCING, ALARM, PROPAGATION, RELATED_ENTITIES_AGGREGATION, ENTITY_AGGREGATION) but Springdoc exposes only 2. `scripts/patch-spec.ts:patchCalculatedFieldConfiguration` synthesizes 4 of the missing 5; Geofencing remains TODO because its dependency tree (`EntityCoordinates`, `ZoneGroupConfiguration`) is also missing from the spec.

### B. Writable / Info shape skew

Most TB entities have 4 shape variants on the wire: `Foo`, `FooInfo`, `FooWritable`, `FooInfoWritable`. Read and write endpoints share the same Java model, so any patch on `Foo` almost always needs to cover all four — or explicitly accept that some don't exist in the current spec (hey-api synthesizes `*Writable` downstream from `Foo` when the spec omits them).

Use the `forEachShape(baseName, schemas, fn)` helper in `patch-spec.ts` instead of hardcoding the variant list. It iterates `['', 'Info', 'Writable', 'InfoWritable']`, logs which shapes were patched / already-patched / missing-from-spec, and lets you spot Writable-skew regressions in CI output.

### Round-trip tests are the cheapest detection

For every polymorphic variant the SDK should support, `tests/cf-roundtrip.test.ts` constructs a typed instance, JSON-cycles it, and validates with the generated Zod schema. When you add a variant, add the test alongside — that's how an unrepresentable variant gets caught before publish, without needing a live TB. Don't ship a variant patch without its round-trip test.

### Don't tighten these

Some upstream-Java models look "wrong" but are intentional. Leave them alone:

- `Argument.refEntityKey` is optional — TB supports `refDynamicSourceConfiguration` (CURRENT_OWNER / RELATION_PATH_QUERY) as an alternative source.
- Top-level `CalculatedField.type` and `CalculatedField.configuration.type` are both on the wire. They're independent Java fields, not a redundancy. Keep both.

## Versioning

Package versions follow `MAJOR.MINOR.PATCH-<edition>.<build>.<client-revision>` — mirrors the TB server version with a prerelease tag pinning the exact upstream spec build (e.g. `4.3.1-pe.1.0` = TB `4.3.1.1PE`, first client revision). Bare versions like `4.3.1` are never published. Full details in README "Versioning".

Branch model: `main` tracks the latest TB minor; older minors get `release/<MAJOR>.<MINOR>.x` branches cut on demand for backports.

## Releasing

Releases are **version-driven**, not tag-driven. To publish: bump `version` in `package.json` (in a PR) and merge to `main`. `.github/workflows/release.yml` runs on every push to `main`, compares `package.json` against npm, and publishes only when the version isn't already there — then pushes a `v<version>` tag for traceability. Non-bump merges are a clean no-op. Do not push `v*` tags by hand; the workflow owns tagging.

Requirements: `NPM_TOKEN` repo secret must be an npm **Automation** token (2FA-exempt; a Granular/Classic token fails with `EOTP` under the org's 2FA-on-write policy). To retry a failed publish, bump the `<client-revision>` segment and merge again, or use the workflow's `workflow_dispatch` button.
