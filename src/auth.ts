import { client as defaultClient } from './generated/client.gen'
import type { Client } from './generated/client'

export interface LoginResponse {
	token: string
	refreshToken: string
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
