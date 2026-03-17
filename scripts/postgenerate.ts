import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const GENERATED_DIR = resolve(import.meta.dirname, '..', 'src', 'generated')
const TYPES_PATH = resolve(GENERATED_DIR, 'types.gen.ts')
const ZOD_PATH = resolve(GENERATED_DIR, 'zod.gen.ts')

/** Helper: replace a string, warn if 0 replacements, return updated content. */
function replace(
  content: string,
  target: string,
  replacement: string,
  label: string,
): string {
  if (!content.includes(target)) {
    console.warn(`postgenerate: WARNING — "${label}" found 0 matches. Generator output may have changed.`)
    return content
  }
  const updated = content.replaceAll(target, replacement)
  const count = content.split(target).length - 1
  console.log(`postgenerate: ${label} — ${count} replacement(s)`)
  return updated
}

/**
 * Transform 1: makes every `.optional()` Zod field also accept `null`.
 *
 * The ThingsBoard API returns `null` for optional fields (e.g. `Asset.label`),
 * but the code generator only emits `.optional()` which accepts `undefined`.
 * This replaces `.optional()` with `.nullable().optional()` throughout
 * the generated Zod file so that runtime validation passes for real API data.
 */
function makeOptionalFieldsNullable() {
  const original = readFileSync(ZOD_PATH, 'utf8')
  const transformed = original.replaceAll('.optional()', '.nullable().optional()')
  const count = (original.match(/\.optional\(\)/g) ?? []).length

  if (count === 0) {
    console.log('postgenerate: no .optional() fields found — skipping.')
    return
  }

  writeFileSync(ZOD_PATH, transformed, 'utf8')
  console.log(`postgenerate: replaced ${count} .optional() → .nullable().optional() in zod.gen.ts`)
}

/**
 * Transform 2: Fix TsValue.value from `string` to `string | number | boolean`.
 *
 * With `useStrictDataTypes: true`, ThingsBoard returns typed values.
 */
function fixTsValueType() {
  // --- types.gen.ts ---
  let types = readFileSync(TYPES_PATH, 'utf8')
  types = replace(
    types,
    `export type TsValue = {\n    ts?: number;\n    value?: string;\n    count?: number;\n};`,
    `export type TsValue = {\n    ts?: number;\n    value?: string | number | boolean;\n    count?: number;\n};`,
    'TsValue.value in types.gen.ts',
  )
  writeFileSync(TYPES_PATH, types, 'utf8')

  // --- zod.gen.ts ---
  let zod = readFileSync(ZOD_PATH, 'utf8')
  zod = replace(
    zod,
    'value: z.string().nullable().optional()',
    'value: z.union([z.string(), z.number(), z.boolean()]).nullable().optional()',
    'zTsValue.value in zod.gen.ts',
  )
  writeFileSync(ZOD_PATH, zod, 'utf8')
}

/**
 * Transform 3: Fix telemetry/attribute response types from `string` to proper types.
 */
function fixTelemetryResponseTypes() {
  // --- types.gen.ts ---
  let types = readFileSync(TYPES_PATH, 'utf8')

  types = replace(
    types,
    `export type GetLatestTimeseriesResponses = {\n    /**\n     * OK\n     */\n    200: string;\n};`,
    `export type GetLatestTimeseriesResponses = {\n    /**\n     * OK\n     */\n    200: Record<string, TsValue[]>;\n};`,
    'GetLatestTimeseriesResponses in types.gen.ts',
  )

  types = replace(
    types,
    `export type GetAttributesResponses = {\n    /**\n     * OK\n     */\n    200: string;\n};`,
    `export type GetAttributesResponses = {\n    /**\n     * OK\n     */\n    200: Array<AttributeEntry>;\n};`,
    'GetAttributesResponses in types.gen.ts',
  )

  types = replace(
    types,
    `export type GetAttributesByScopeResponses = {\n    /**\n     * OK\n     */\n    200: string;\n};`,
    `export type GetAttributesByScopeResponses = {\n    /**\n     * OK\n     */\n    200: Array<AttributeEntry>;\n};`,
    'GetAttributesByScopeResponses in types.gen.ts',
  )

  writeFileSync(TYPES_PATH, types, 'utf8')

  // --- zod.gen.ts ---
  let zod = readFileSync(ZOD_PATH, 'utf8')

  zod = replace(
    zod,
    'export const zGetLatestTimeseriesResponse = z.string();',
    'export const zGetLatestTimeseriesResponse = z.record(z.string(), z.array(zTsValue));',
    'zGetLatestTimeseriesResponse in zod.gen.ts',
  )

  zod = replace(
    zod,
    'export const zGetAttributesResponse = z.string();',
    'export const zGetAttributesResponse = z.array(z.object({ key: z.string(), value: z.unknown(), lastUpdateTs: z.number().nullable().optional() }));',
    'zGetAttributesResponse in zod.gen.ts',
  )

  zod = replace(
    zod,
    'export const zGetAttributesByScopeResponse = z.string();',
    'export const zGetAttributesByScopeResponse = z.array(z.object({ key: z.string(), value: z.unknown(), lastUpdateTs: z.number().nullable().optional() }));',
    'zGetAttributesByScopeResponse in zod.gen.ts',
  )

  writeFileSync(ZOD_PATH, zod, 'utf8')
}

/**
 * Transform 4: Append AttributeEntry type to types.gen.ts.
 */
function addAttributeEntryType() {
  let types = readFileSync(TYPES_PATH, 'utf8')

  if (types.includes('export type AttributeEntry =')) {
    console.log('postgenerate: AttributeEntry already exists — skipping.')
    return
  }

  types += `\nexport type AttributeEntry = {\n    key: string;\n    value: unknown;\n    lastUpdateTs?: number;\n};\n`
  writeFileSync(TYPES_PATH, types, 'utf8')
  console.log('postgenerate: appended AttributeEntry type to types.gen.ts')
}

// --- Run all transforms in order ---
makeOptionalFieldsNullable()  // must run first (patches .optional() in zod)
fixTsValueType()
fixTelemetryResponseTypes()
addAttributeEntryType()
