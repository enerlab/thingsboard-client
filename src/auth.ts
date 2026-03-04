import { client as defaultClient } from './generated/client.gen'
import type { Client } from './generated/client'

export interface LoginResponse {
	token: string
	refreshToken: string
}

/** Tracks clients that already have the auth interceptor installed. */
const authInstalled = new WeakSet<Client>()

/**
 * Installs a request interceptor that sets the `X-Authorization` header
 * from the client's `auth` config value. Safe to call multiple times —
 * duplicate interceptors are prevented via a WeakSet guard.
 */
export function setupAuth(client: Client): void {
	if (authInstalled.has(client)) return
	authInstalled.add(client)
	client.interceptors.request.use((request, options) => {
		const token = options.auth as string | undefined
		if (token) {
			request.headers.set('X-Authorization', `Bearer ${token}`)
		}
		return request
	})
}

/**
 * Authenticates with ThingsBoard and sets the auth token on the client.
 *
 * The `/api/auth/login` endpoint is not part of the ThingsBoard OpenAPI spec,
 * so this helper is provided manually.
 */
export async function login(
	username: string,
	password: string,
	options?: { client?: Client },
): Promise<LoginResponse> {
	const c = options?.client ?? defaultClient
	setupAuth(c)
	const config = c.getConfig()
	const baseUrl = config.baseUrl ?? ''

	const response = await fetch(`${baseUrl}/api/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ username, password }),
	})

	if (!response.ok) {
		const text = await response.text()
		throw new Error(`Login failed (${response.status}): ${text}`)
	}

	const body = (await response.json()) as LoginResponse
	c.setConfig({ auth: body.token })
	return body
}

/**
 * Sets the base URL on the client.
 */
export function setBaseUrl(
	baseUrl: string,
	options?: { client?: Client },
): void {
	const c = options?.client ?? defaultClient
	c.setConfig({ baseUrl })
}

/**
 * Sets the auth token on the client.
 */
export function setAuth(
	token: string,
	options?: { client?: Client },
): void {
	const c = options?.client ?? defaultClient
	setupAuth(c)
	c.setConfig({ auth: token })
}

/**
 * Clears the auth token from the client.
 */
export function logout(options?: { client?: Client }): void {
	const c = options?.client ?? defaultClient
	c.setConfig({ auth: undefined })
}
