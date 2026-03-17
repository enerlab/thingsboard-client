import { client as defaultClient } from './generated/client.gen'
import type { Client } from './generated/client'

export interface LoginResponse {
	token: string
	refreshToken: string
}

export type AuthConfig =
	| { mode: 'bearer'; token: string }
	| { mode: 'apiKey'; key: string }
	| { mode: 'dynamic'; resolve: () => string | Promise<string> }

/** Stores the auth config for each client that has the interceptor installed. */
const authConfigs = new WeakMap<Client, AuthConfig | undefined>()

/**
 * Installs a request interceptor that sets the `X-Authorization` header.
 *
 * - **No config** — reads `options.auth` and sets `Bearer ${token}` (backward compat with `login()`).
 * - **`bearer`** — static `Bearer ${token}` header.
 * - **`apiKey`** — static `ApiKey ${key}` header.
 * - **`dynamic`** — calls `resolve()` per-request for the full header value.
 *
 * Safe to call multiple times — duplicate interceptors are prevented via a WeakMap guard.
 * Calling again with a different config updates the stored config without adding a new interceptor.
 */
export function setupAuth(client: Client, config?: AuthConfig): void {
	if (authConfigs.has(client)) {
		// Interceptor already installed — just update the config
		authConfigs.set(client, config)
		return
	}

	authConfigs.set(client, config)

	client.interceptors.request.use(async (request, options) => {
		const cfg = authConfigs.get(client)

		let headerValue: string | undefined

		if (cfg === undefined) {
			// No config — use options.auth (backward compat with login())
			const token = options.auth as string | undefined
			if (token) {
				headerValue = `Bearer ${token}`
			}
		} else if (cfg.mode === 'bearer') {
			headerValue = `Bearer ${cfg.token}`
		} else if (cfg.mode === 'apiKey') {
			headerValue = `ApiKey ${cfg.key}`
		} else if (cfg.mode === 'dynamic') {
			headerValue = await cfg.resolve()
		}

		if (headerValue) {
			request.headers.set('X-Authorization', headerValue)
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
 * Clears the auth token from the client.
 */
export function logout(options?: { client?: Client }): void {
	const c = options?.client ?? defaultClient
	c.setConfig({ auth: undefined })
}
