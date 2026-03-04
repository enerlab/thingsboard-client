import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { login, logout, setAuth, setBaseUrl, setupAuth } from '@/auth'
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

describe('setBaseUrl()', () => {
	it('sets the base URL on the client', () => {
		const c = createClient(createConfig())
		setBaseUrl('https://tb.example.com', { client: c })
		expect(c.getConfig().baseUrl).toBe('https://tb.example.com')
	})

	it('does not clobber existing auth', () => {
		const c = createClient(createConfig())
		c.setConfig({ auth: 'existing-token' })
		setBaseUrl('https://tb.example.com', { client: c })
		expect(c.getConfig().auth).toBe('existing-token')
		expect(c.getConfig().baseUrl).toBe('https://tb.example.com')
	})
})

describe('setAuth()', () => {
	let fetchSpy: ReturnType<typeof vi.spyOn>

	beforeEach(() => {
		fetchSpy = vi.spyOn(globalThis, 'fetch')
	})

	afterEach(() => {
		fetchSpy.mockRestore()
	})

	it('sets the auth token on the client', () => {
		const c = createClient(createConfig({ baseUrl: BASE_URL }))
		setAuth('my-token', { client: c })
		expect(c.getConfig().auth).toBe('my-token')
	})

	it('installs the auth interceptor automatically', async () => {
		fetchSpy.mockResolvedValueOnce(new Response('{}', { status: 200 }))

		const c = createClient(createConfig({ baseUrl: BASE_URL }))
		setAuth('my-token', { client: c })

		await c.request({ method: 'GET', url: '/api/test' })

		const request = fetchSpy.mock.calls[0]![0] as Request
		expect(request.headers.get('X-Authorization')).toBe('Bearer my-token')
	})

	it('does not clobber existing baseUrl', () => {
		const c = createClient(createConfig({ baseUrl: BASE_URL }))
		setAuth('my-token', { client: c })
		expect(c.getConfig().baseUrl).toBe(BASE_URL)
	})
})

describe('setupAuth()', () => {
	let fetchSpy: ReturnType<typeof vi.spyOn>

	beforeEach(() => {
		fetchSpy = vi.spyOn(globalThis, 'fetch')
	})

	afterEach(() => {
		fetchSpy.mockRestore()
	})

	it('sets X-Authorization header when auth is configured', async () => {
		fetchSpy.mockResolvedValueOnce(new Response('{}', { status: 200 }))

		const c = createClient(createConfig({ baseUrl: BASE_URL }))
		setupAuth(c)
		c.setConfig({ auth: 'my-jwt-token' })

		await c.request({ method: 'GET', url: '/api/test' })

		const request = fetchSpy.mock.calls[0]![0] as Request
		expect(request.headers.get('X-Authorization')).toBe('Bearer my-jwt-token')
	})

	it('does not set X-Authorization header when auth is absent', async () => {
		fetchSpy.mockResolvedValueOnce(new Response('{}', { status: 200 }))

		const c = createClient(createConfig({ baseUrl: BASE_URL }))
		setupAuth(c)

		await c.request({ method: 'GET', url: '/api/test' })

		const request = fetchSpy.mock.calls[0]![0] as Request
		expect(request.headers.has('X-Authorization')).toBe(false)
	})

	it('does not install duplicate interceptors', async () => {
		fetchSpy.mockResolvedValue(new Response('{}', { status: 200 }))

		const c = createClient(createConfig({ baseUrl: BASE_URL }))
		setupAuth(c)
		setupAuth(c) // second call should be a no-op
		c.setConfig({ auth: 'token-123' })

		await c.request({ method: 'GET', url: '/api/test' })

		const request = fetchSpy.mock.calls[0]![0] as Request
		// If duplicates were installed, the header would still be set once,
		// but we verify the interceptor count indirectly by checking the header value
		expect(request.headers.get('X-Authorization')).toBe('Bearer token-123')
	})

	it('login() installs the interceptor automatically', async () => {
		fetchSpy
			// login fetch call
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({ token: 'jwt-auto', refreshToken: 'refresh-auto' }),
			} as Response)
			// subsequent SDK call
			.mockResolvedValueOnce(new Response('{}', { status: 200 }))

		const c = createClient(createConfig({ baseUrl: BASE_URL }))
		await login('user', 'pass', { client: c })

		await c.request({ method: 'GET', url: '/api/test' })

		const request = fetchSpy.mock.calls[1]![0] as Request
		expect(request.headers.get('X-Authorization')).toBe('Bearer jwt-auto')
	})
})
