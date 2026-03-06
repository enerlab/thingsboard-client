import { client, login } from '../src/index'

/**
 * Initializes the ThingsBoard client using environment variables.
 *
 * Required env vars:
 *   TB_BASE_URL  — ThingsBoard instance URL (default: https://iot.enerlab.io)
 *   TB_USERNAME  — Login username
 *   TB_PASSWORD  — Login password
 *
 * After init, the client is ready for authenticated API calls.
 * The auth token is also accessible via `getAuthToken()` for PE API wrappers.
 */

let authToken: string | null = null

export async function initTbClient(): Promise<void> {
	const baseUrl = (process.env.TB_BASE_URL ?? 'https://iot.enerlab.io').replace(
		/\/$/,
		'',
	)
	const username = process.env.TB_USERNAME
	const password = process.env.TB_PASSWORD

	if (!username || !password) {
		throw new Error(
			'Missing ThingsBoard credentials. Set TB_USERNAME and TB_PASSWORD environment variables.',
		)
	}

	client.setConfig({ baseUrl })
	const { token } = await login(username, password)
	authToken = token
}

export function getAuthToken(): string {
	if (!authToken) {
		throw new Error(
			'ThingsBoard client not initialized. Call initTbClient() first.',
		)
	}
	return authToken
}

export function getBaseUrl(): string {
	const config = client.getConfig()
	return ((config.baseUrl as string) ?? 'https://iot.enerlab.io').replace(
		/\/$/,
		'',
	)
}
