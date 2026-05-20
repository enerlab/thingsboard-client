import { describe, it, expect } from 'vitest'
import { zCalculatedField } from '@/generated/zod.gen'
import type { CalculatedField } from '@/generated/types.gen'

/**
 * One round-trip test per CalculatedField variant: construct a typed fixture,
 * JSON-cycle it, validate against the generated Zod schema. These tests catch
 * "the SDK can't express this variant" before a downstream consumer hits it.
 *
 * When a new variant is added to `patchCalculatedFieldConfiguration`, add a
 * fixture here too. See CLAUDE.md "Verifying SDK completeness".
 */

const ENTITY_ID = { id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', entityType: 'DEVICE' as const }
const ARGUMENT = { refEntityKey: { key: 'temperature', type: 'TS_LATEST' as const } }
const TS_OUTPUT = { type: 'TIME_SERIES' as const }
const ATTR_OUTPUT = { type: 'ATTRIBUTES' as const }

function roundTrip(cf: CalculatedField) {
  const cycled: unknown = JSON.parse(JSON.stringify(cf))
  return zCalculatedField.safeParse(cycled)
}

describe('CalculatedField round-trip per variant', () => {
  it('SIMPLE', () => {
    const cf: CalculatedField = {
      entityId: ENTITY_ID,
      type: 'SIMPLE',
      configuration: {
        type: 'SIMPLE',
        arguments: { x: ARGUMENT },
        expression: 'x',
        output: TS_OUTPUT,
      },
    }
    const r = roundTrip(cf)
    expect(r.success, r.success ? '' : JSON.stringify(r.error.issues)).toBe(true)
  })

  it('SCRIPT', () => {
    const cf: CalculatedField = {
      entityId: ENTITY_ID,
      type: 'SCRIPT',
      configuration: {
        type: 'SCRIPT',
        arguments: { x: ARGUMENT },
        expression: 'return x * 2',
        output: TS_OUTPUT,
      },
    }
    const r = roundTrip(cf)
    expect(r.success, r.success ? '' : JSON.stringify(r.error.issues)).toBe(true)
  })

  it('PROPAGATION', () => {
    const cf: CalculatedField = {
      entityId: ENTITY_ID,
      type: 'PROPAGATION',
      configuration: {
        type: 'PROPAGATION',
        arguments: { x: ARGUMENT },
        expression: null,
        output: ATTR_OUTPUT,
        relation: { direction: 'FROM', relationType: 'Contains' },
        applyExpressionToResolvedArguments: false,
      },
    }
    const r = roundTrip(cf)
    expect(r.success, r.success ? '' : JSON.stringify(r.error.issues)).toBe(true)
  })

  it('ALARM', () => {
    const cf: CalculatedField = {
      entityId: ENTITY_ID,
      type: 'ALARM',
      configuration: {
        type: 'ALARM',
        arguments: { x: ARGUMENT },
        createRules: { CRITICAL: {} },
      },
    }
    const r = roundTrip(cf)
    expect(r.success, r.success ? '' : JSON.stringify(r.error.issues)).toBe(true)
  })

  it('RELATED_ENTITIES_AGGREGATION', () => {
    const cf: CalculatedField = {
      entityId: ENTITY_ID,
      type: 'RELATED_ENTITIES_AGGREGATION',
      configuration: {
        type: 'RELATED_ENTITIES_AGGREGATION',
        relation: { direction: 'TO', relationType: 'Contains' },
        arguments: { x: ARGUMENT },
        metrics: { avgTemp: { function: 'AVG', input: { type: 'key', key: 'x' } } },
        output: TS_OUTPUT,
      },
    }
    const r = roundTrip(cf)
    expect(r.success, r.success ? '' : JSON.stringify(r.error.issues)).toBe(true)
  })

  it('ENTITY_AGGREGATION', () => {
    const cf: CalculatedField = {
      entityId: ENTITY_ID,
      type: 'ENTITY_AGGREGATION',
      configuration: {
        type: 'ENTITY_AGGREGATION',
        arguments: { x: ARGUMENT },
        metrics: { sumX: { function: 'SUM', input: { type: 'key', key: 'x' } } },
        interval: { type: 'CUSTOM', tz: 'UTC', durationSec: 60 },
        output: TS_OUTPUT,
      },
    }
    const r = roundTrip(cf)
    expect(r.success, r.success ? '' : JSON.stringify(r.error.issues)).toBe(true)
  })

  it('rejects unknown configuration.type', () => {
    const cf: unknown = {
      entityId: ENTITY_ID,
      configuration: { type: 'NOT_A_REAL_VARIANT', arguments: {}, output: TS_OUTPUT },
    }
    const r = zCalculatedField.safeParse(cf)
    expect(r.success).toBe(false)
  })
})
