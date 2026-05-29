import { describe, it, expect } from 'vitest'
import {
	zSaveEntityAttributesV1Data,
	zSaveEntityAttributesV2Data,
	zSaveDeviceAttributesData,
	zPostDeviceAttributesData,
	zSaveEntityTelemetryData,
	zSaveEntityTelemetryWithTtlData,
	zPostRpcRequestData,
	zReplyToCommandData,
	zProvisionDeviceData,
} from '@/generated/zod.gen'

/*
 * Guards `patchJsonStringRequestBodies` in `scripts/patch-spec.ts`. The TB
 * OpenAPI spec types these 9 request bodies as `{type: "string"}` even though
 * TB rejects string-typed bodies on the wire with "Request is not a JSON
 * object". Pre-patch, the generated schema accepted `'{"k":"v"}'` (a string)
 * and rejected `{k:'v'}` (an object). Post-patch, the inverse. If this test
 * ever flips to passing on a string body, the patch silently reverted.
 */

const SAMPLE_OBJECT = { archivedAt: 1_778_700_860_000, customNote: 'foo' }
const SAMPLE_STRING = JSON.stringify(SAMPLE_OBJECT)

const VALID_PATH = {
	entityType: 'DEVICE',
	entityId: '11111111-1111-1111-1111-111111111111',
	scope: 'SERVER_SCOPE' as const,
}

const cases: Array<{
	name: string
	schema: { body: { safeParse: (v: unknown) => { success: boolean } } }
}> = [
	{ name: 'zSaveEntityAttributesV1Data', schema: zSaveEntityAttributesV1Data.shape },
	{ name: 'zSaveEntityAttributesV2Data', schema: zSaveEntityAttributesV2Data.shape },
	{ name: 'zSaveDeviceAttributesData', schema: zSaveDeviceAttributesData.shape },
	{ name: 'zPostDeviceAttributesData', schema: zPostDeviceAttributesData.shape },
	{ name: 'zSaveEntityTelemetryData', schema: zSaveEntityTelemetryData.shape },
	{ name: 'zSaveEntityTelemetryWithTtlData', schema: zSaveEntityTelemetryWithTtlData.shape },
	{ name: 'zPostRpcRequestData', schema: zPostRpcRequestData.shape },
	{ name: 'zReplyToCommandData', schema: zReplyToCommandData.shape },
	{ name: 'zProvisionDeviceData', schema: zProvisionDeviceData.shape },
]

describe('JSON-object request body schemas (patch-spec patchJsonStringRequestBodies)', () => {
	for (const { name, schema } of cases) {
		it(`${name}.body accepts an object payload`, () => {
			expect(schema.body.safeParse(SAMPLE_OBJECT).success).toBe(true)
		})
		it(`${name}.body rejects a JSON-encoded string payload (regression guard)`, () => {
			expect(schema.body.safeParse(SAMPLE_STRING).success).toBe(false)
		})
	}

	it('full SaveEntityAttributesV2Data accepts object body + valid path', () => {
		const result = zSaveEntityAttributesV2Data.safeParse({
			body: SAMPLE_OBJECT,
			path: VALID_PATH,
		})
		expect(result.success).toBe(true)
	})

	it('body accepts recursive JsonValue payloads (nested objects + arrays)', () => {
		const nested = {
			stringKey: 'value',
			numberKey: 42,
			booleanKey: true,
			arrayKey: [1, 'two', false, { inner: ['deep', { deeper: 1 }] }],
			objectKey: { nested: { again: { andAgain: 'leaf' } } },
		}
		expect(zSaveEntityAttributesV2Data.shape.body.safeParse(nested).success).toBe(true)
	})

	it('body rejects null values — TB rejects null with HTTP 500 "Can\'t parse value: null"', () => {
		// Verified against PE 4.3.1.1: POST .../attributes/SERVER_SCOPE with
		// `{k: null}` returns 500 regardless of whether the key exists.
		expect(zSaveEntityAttributesV2Data.shape.body.safeParse({ k: null }).success).toBe(false)
		expect(zSaveEntityAttributesV2Data.shape.body.safeParse({ nested: [null] }).success).toBe(false)
	})

	it('body rejects values that are not valid JSON (functions, undefined)', () => {
		// JsonValue excludes function/undefined — guards against accidentally
		// passing non-JSON-serializable values that would error at JSON.stringify.
		const withFunction = { fn: () => 'oops' } as unknown
		const withUndefined = { x: undefined } as unknown
		expect(zSaveEntityAttributesV2Data.shape.body.safeParse(withFunction).success).toBe(false)
		expect(zSaveEntityAttributesV2Data.shape.body.safeParse(withUndefined).success).toBe(false)
	})
})
