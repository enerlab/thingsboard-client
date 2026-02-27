import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { login, logout } from '@/auth'
import { createClient, createConfig } from '@/generated/client'

const BASE_URL = 'https://tb.example.com'

describe('login()', () => {
	let fetchSpy: ReturnType<typeof vi.spyOn>

	beforeEach(() => {
		fetchSpy = vi.spyOn(globalThis, 'fetch')
	})

	afterEach(() => {
		fetchSpy.mockRestore()
	})

	it('POSTs credentials to /api/auth/login', async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ token: 'jwt-123', refreshToken: 'refresh-456' }),
		} as Response)

		const c = createClient(createConfig({ baseUrl: BASE_URL }))
		await login('tenant@thingsboard.org', 'tenant', { client: c })

		expect(fetchSpy).toHaveBeenCalledWith(`${BASE_URL}/api/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username: 'tenant@thingsboard.org', password: 'tenant' }),
		})
	})

	it('returns token and refreshToken', async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ token: 'jwt-123', refreshToken: 'refresh-456' }),
		} as Response)

		const c = createClient(createConfig({ baseUrl: BASE_URL }))
		const result = await login('user', 'pass', { client: c })

		expect(result).toEqual({ token: 'jwt-123', refreshToken: 'refresh-456' })
	})

	it('sets the auth token on the client after login', async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ token: 'jwt-123', refreshToken: 'refresh-456' }),
		} as Response)

		const c = createClient(createConfig({ baseUrl: BASE_URL }))
		await login('user', 'pass', { client: c })

		expect(c.getConfig().auth).toBe('jwt-123')
	})

	it('throws on failed login', async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: false,
			status: 401,
			text: async () => 'Unauthorized',
		} as Response)

		const c = createClient(createConfig({ baseUrl: BASE_URL }))
		await expect(login('bad@user.com', 'wrong', { client: c })).rejects.toThrow(
			'Login failed (401): Unauthorized',
		)
	})

	it('does not set auth on failed login', async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: false,
			status: 401,
			text: async () => 'Unauthorized',
		} as Response)

		const c = createClient(createConfig({ baseUrl: BASE_URL }))
		try {
			await login('bad@user.com', 'wrong', { client: c })
		} catch {
			// expected
		}

		expect(c.getConfig().auth).toBeUndefined()
	})
})

describe('logout()', () => {
	it('clears the auth token on the client', () => {
		const c = createClient(createConfig({ baseUrl: BASE_URL }))
		c.setConfig({ auth: 'some-token' })
		expect(c.getConfig().auth).toBe('some-token')

		logout({ client: c })
		expect(c.getConfig().auth).toBeUndefined()
	})
})
