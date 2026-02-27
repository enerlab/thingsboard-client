import { describe, it, expect } from 'vitest'
import {
	zDevice,
	zCustomer,
	zDeviceCredentials,
	zEntityTypeFilter,
} from '@/generated/zod.gen'

describe('Zod schema contract tests', () => {
	describe('zDevice', () => {
		it('accepts a realistic device payload', () => {
			const payload = {
				name: 'Temperature Sensor 01',
				type: 'thermometer',
				additionalInfo: '{"description": "Main hall sensor"}',
				createdTime: 1700000000000,
				customerId: {
					id: 'customer-uuid-123',
					entityType: 'CUSTOMER',
				},
				id: {
					id: 'device-uuid-456',
					entityType: 'DEVICE',
				},
				tenantId: {
					id: 'tenant-uuid-789',
					entityType: 'TENANT',
				},
			}

			const result = zDevice.safeParse(payload)
			expect(result.success).toBe(true)
		})

		it('accepts a minimal device payload', () => {
			const result = zDevice.safeParse({})
			expect(result.success).toBe(true)
		})
	})

	describe('zCustomer', () => {
		it('accepts a realistic customer payload', () => {
			const payload = {
				title: 'Acme Corp',
				name: 'Acme Corp',
				email: 'admin@acme.com',
				phone: '+1-555-0100',
				country: 'US',
				city: 'San Francisco',
				state: 'CA',
				zip: '94105',
				address: '123 Market St',
				createdTime: 1700000000000,
				id: {
					id: 'customer-uuid-123',
					entityType: 'CUSTOMER',
				},
				tenantId: {
					id: 'tenant-uuid-789',
					entityType: 'TENANT',
				},
			}

			const result = zCustomer.safeParse(payload)
			expect(result.success).toBe(true)
		})

		it('accepts a minimal customer payload', () => {
			const result = zCustomer.safeParse({})
			expect(result.success).toBe(true)
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
					id: 'device-uuid-456',
					entityType: 'DEVICE',
				},
				id: {
					id: 'cred-uuid-001',
				},
			}

			const result = zDeviceCredentials.safeParse(payload)
			expect(result.success).toBe(true)
		})

		it('accepts X509_CERTIFICATE credentials', () => {
			const payload = {
				credentialsType: 'X509_CERTIFICATE',
				credentialsValue: 'PEM-CERT-DATA',
			}

			const result = zDeviceCredentials.safeParse(payload)
			expect(result.success).toBe(true)
		})

		it('rejects invalid credentialsType', () => {
			const payload = {
				credentialsType: 'INVALID_TYPE',
			}

			const result = zDeviceCredentials.safeParse(payload)
			expect(result.success).toBe(false)
		})
	})

	describe('zEntityTypeFilter', () => {
		it('accepts a valid entity type filter', () => {
			const payload = {
				relationType: 'Contains',
				entityTypes: ['DEVICE', 'ASSET'],
			}

			const result = zEntityTypeFilter.safeParse(payload)
			expect(result.success).toBe(true)
		})

		it('requires relationType', () => {
			const payload = {
				entityTypes: ['DEVICE'],
			}

			const result = zEntityTypeFilter.safeParse(payload)
			expect(result.success).toBe(false)
		})

		it('requires entityTypes', () => {
			const payload = {
				relationType: 'Contains',
			}

			const result = zEntityTypeFilter.safeParse(payload)
			expect(result.success).toBe(false)
		})

		it('rejects invalid entity types', () => {
			const payload = {
				relationType: 'Contains',
				entityTypes: ['INVALID_TYPE'],
			}

			const result = zEntityTypeFilter.safeParse(payload)
			expect(result.success).toBe(false)
		})
	})
})
