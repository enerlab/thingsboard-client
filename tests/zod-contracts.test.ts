import { describe, it, expect } from 'vitest'
import {
	zDevice,
	zCustomer,
	zAsset,
	zDeviceCredentials,
	zEntityTypeFilter,
} from '@/generated/zod.gen'

// Valid RFC 4122 UUIDs for test fixtures
const TENANT_UUID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const CUSTOMER_UUID = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e'
const DEVICE_UUID = 'c3d4e5f6-a7b8-4c9d-ae0f-1a2b3c4d5e6f'
const DEVICE_PROFILE_UUID = 'd4e5f6a7-b8c9-4dae-8f1a-2b3c4d5e6f7a'
const CRED_UUID = 'e5f6a7b8-c9da-4eaf-9a2b-3c4d5e6f7a8b'

describe('Zod schema contract tests', () => {
	describe('zDevice', () => {
		it('accepts a realistic device payload', () => {
			const payload = {
				name: 'Temperature Sensor 01',
				type: 'thermometer',
				label: 'Main hall sensor',
				additionalInfo: { description: 'Main hall sensor' },
				createdTime: 1700000000000,
				deviceProfileId: {
					id: DEVICE_PROFILE_UUID,
					entityType: 'DEVICE_PROFILE',
				},
				customerId: {
					id: CUSTOMER_UUID,
					entityType: 'CUSTOMER',
				},
				id: {
					id: DEVICE_UUID,
					entityType: 'DEVICE',
				},
				tenantId: {
					id: TENANT_UUID,
					entityType: 'TENANT',
				},
			}

			const result = zDevice.safeParse(payload)
			expect(result.success).toBe(true)
		})

		it('accepts a minimal device payload', () => {
			const result = zDevice.safeParse({
				name: 'Sensor',
				deviceProfileId: {
					id: DEVICE_PROFILE_UUID,
					entityType: 'DEVICE_PROFILE',
				},
			})
			expect(result.success).toBe(true)
		})

		it('rejects a device without name', () => {
			const result = zDevice.safeParse({
				deviceProfileId: {
					id: DEVICE_PROFILE_UUID,
					entityType: 'DEVICE_PROFILE',
				},
			})
			expect(result.success).toBe(false)
		})
	})

	describe('zCustomer', () => {
		it('accepts a realistic customer payload', () => {
			const payload = {
				title: 'Acme Corp',
				email: 'admin@acme.com',
				phone: '+1-555-0100',
				country: 'US',
				city: 'San Francisco',
				state: 'CA',
				zip: '94105',
				address: '123 Market St',
				createdTime: 1700000000000,
				id: {
					id: CUSTOMER_UUID,
					entityType: 'CUSTOMER',
				},
				tenantId: {
					id: TENANT_UUID,
					entityType: 'TENANT',
				},
			}

			const result = zCustomer.safeParse(payload)
			expect(result.success).toBe(true)
		})

		it('accepts a minimal customer payload', () => {
			const result = zCustomer.safeParse({
				title: 'Acme Corp',
				email: 'admin@acme.com',
			})
			expect(result.success).toBe(true)
		})

		it('rejects a customer without title', () => {
			const result = zCustomer.safeParse({ email: 'a@b.com' })
			expect(result.success).toBe(false)
		})
	})

	describe('zDeviceCredentials', () => {
		it('accepts ACCESS_TOKEN credentials', () => {
			const payload = {
				credentialsType: 'ACCESS_TOKEN',
				credentialsId: 'abc123token',
				credentialsValue: 'abc123token',
				createdTime: 1700000000000,
				deviceId: {
					id: DEVICE_UUID,
					entityType: 'DEVICE',
				},
				id: {
					id: CRED_UUID,
				},
			}

			const result = zDeviceCredentials.safeParse(payload)
			expect(result.success).toBe(true)
		})

		it('accepts X509_CERTIFICATE credentials', () => {
			const payload = {
				credentialsType: 'X509_CERTIFICATE',
				credentialsId: 'cert-fingerprint',
				credentialsValue: 'PEM-CERT-DATA',
				deviceId: {
					id: DEVICE_UUID,
					entityType: 'DEVICE',
				},
				id: {
					id: CRED_UUID,
				},
			}

			const result = zDeviceCredentials.safeParse(payload)
			expect(result.success).toBe(true)
		})

		it('rejects invalid credentialsType', () => {
			const payload = {
				credentialsType: 'INVALID_TYPE',
				credentialsId: 'abc',
				deviceId: {
					id: DEVICE_UUID,
					entityType: 'DEVICE',
				},
				id: {
					id: CRED_UUID,
				},
			}

			const result = zDeviceCredentials.safeParse(payload)
			expect(result.success).toBe(false)
		})
	})

	describe('zEntityTypeFilter', () => {
		it('accepts a valid entity type filter', () => {
			const payload = {
				type: 'EntityTypeFilter',
				entityType: 'DEVICE',
			}

			const result = zEntityTypeFilter.safeParse(payload)
			expect(result.success).toBe(true)
		})

		it('requires type field', () => {
			const payload = {
				entityType: 'DEVICE',
			}

			const result = zEntityTypeFilter.safeParse(payload)
			expect(result.success).toBe(false)
		})

		it('accepts filter without entityType', () => {
			const payload = {
				type: 'EntityTypeFilter',
			}

			const result = zEntityTypeFilter.safeParse(payload)
			expect(result.success).toBe(true)
		})

		it('rejects invalid entity types', () => {
			const payload = {
				type: 'EntityTypeFilter',
				entityType: 'INVALID_TYPE',
			}

			const result = zEntityTypeFilter.safeParse(payload)
			expect(result.success).toBe(false)
		})
	})

	describe('nullable optional fields', () => {
		it('accepts null for Asset.label', () => {
			const result = zAsset.safeParse({
				name: 'Building A',
				label: null,
			})
			expect(result.success).toBe(true)
		})

		it('accepts null for Asset.type', () => {
			const result = zAsset.safeParse({
				name: 'Building A',
				type: null,
			})
			expect(result.success).toBe(true)
		})

		it('accepts null for Device.label', () => {
			const result = zDevice.safeParse({
				name: 'Sensor',
				deviceProfileId: {
					id: DEVICE_PROFILE_UUID,
					entityType: 'DEVICE_PROFILE',
				},
				label: null,
			})
			expect(result.success).toBe(true)
		})

		it('accepts null for Customer.phone', () => {
			const result = zCustomer.safeParse({
				title: 'Acme Corp',
				email: 'admin@acme.com',
				phone: null,
			})
			expect(result.success).toBe(true)
		})

		it('still accepts undefined for optional fields', () => {
			const result = zAsset.safeParse({
				name: 'Building A',
				label: undefined,
			})
			expect(result.success).toBe(true)
		})

		it('still accepts omitted optional fields', () => {
			const result = zAsset.safeParse({
				name: 'Building A',
			})
			expect(result.success).toBe(true)
		})
	})
})
