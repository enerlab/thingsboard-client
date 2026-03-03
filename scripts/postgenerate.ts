import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Post-generation transform: makes every `.optional()` Zod field also accept `null`.
 *
 * The ThingsBoard API returns `null` for optional fields (e.g. `Asset.label`),
 * but the code generator only emits `.optional()` which accepts `undefined`.
 * This script replaces `.optional()` with `.nullable().optional()` throughout
 * the generated Zod file so that runtime validation passes for real API data.
 */
function makeOptionalFieldsNullable() {
  const filePath = resolve(import.meta.dirname, '..', 'src', 'generated', 'zod.gen.ts')

  const original = readFileSync(filePath, 'utf8')
  const transformed = original.replaceAll('.optional()', '.nullable().optional()')
  const count = (original.match(/\.optional\(\)/g) ?? []).length

  if (count === 0) {
    console.log('postgenerate: no .optional() fields found — skipping.')
    return
  }

  writeFileSync(filePath, transformed, 'utf8')
  console.log(`postgenerate: replaced ${count} .optional() → .nullable().optional() in zod.gen.ts`)
}

makeOptionalFieldsNullable()
