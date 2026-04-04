import { getAuthToken, getBaseUrl } from '../tb-init'

// --- Types ---

interface CalculatedFieldId {
	id: string
	entityType: string
}

export interface CalculatedFieldResponse {
	id: CalculatedFieldId
	name: string
	type: string
	entityId: { id: string; entityType: string }
	configuration: Record<string, unknown>
	configurationVersion: number
}

interface CalculatedFieldsPage {
	data: CalculatedFieldResponse[]
	totalPages: number
	totalElements: number
	hasNext: boolean
}

export interface CalculatedFieldArgument {
	name: string
	key: string
	type: 'TS_LATEST' | 'TS_ROLLING' | 'ATTRIBUTE'
	refEntityId?: string
	refEntityType?: string
	defaultValue?: string
}

export interface CreateCalculatedFieldInput {
	entityType: string
	entityId: string
	name: string
	expression: string
	arguments: CalculatedFieldArgument[]
	outputType?: 'TIME_SERIES' | 'ATTRIBUTES'
}

// --- Helpers ---

function authHeaders(): Record<string, string> {
	return {
		'X-Authorization': `Bearer ${getAuthToken()}`,
		'Content-Type': 'application/json',
	}
}

// --- API Wrappers ---

/**
 * List all calculated fields for an entity.
 */
export async function getCalculatedFields(
	entityType: string,
	entityId: string,
): Promise<CalculatedFieldResponse[]> {
	const url = `${getBaseUrl()}/api/${entityType}/${entityId}/calculatedFields?pageSize=100&page=0`
	const response = await fetch(url, { headers: authHeaders() })

	if (!response.ok) {
		const text = await response.text()
		throw new Error(
			`Failed to list calculated fields: ${String(response.status)} ${text}`,
		)
	}

	const data = (await response.json()) as CalculatedFieldsPage
	return data.data ?? []
}

/**
 * Create a calculated field on an entity.
 * Builds the full payload from the simplified input.
 */
export async function createCalculatedField(
	input: CreateCalculatedFieldInput,
): Promise<CalculatedFieldResponse> {
	// Build arguments map
	const args: Record<string, Record<string, unknown>> = {}
	for (const arg of input.arguments) {
		const entry: Record<string, unknown> = {
			refEntityKey: {
				key: arg.key,
				type: arg.type,
			},
			defaultValue: arg.defaultValue ?? '',
		}

		// If referencing a different entity
		if (arg.refEntityId) {
			entry.refEntityId = {
				id: arg.refEntityId,
				entityType: arg.refEntityType ?? 'DEVICE',
			}
		}

		args[arg.name] = entry
	}

	const payload = {
		type: 'SCRIPT',
		name: input.name,
		configurationVersion: 0,
		entityId: {
			id: input.entityId,
			entityType: input.entityType,
		},
		configuration: {
			type: 'SCRIPT',
			arguments: args,
			expression: input.expression,
			output: {
				type: input.outputType ?? 'TIME_SERIES',
				strategy: {
					type: 'IMMEDIATE',
					ttl: 0,
					saveTimeSeries: true,
					saveLatest: true,
					sendWsUpdate: true,
					processCfs: true,
				},
			},
		},
	}

	const url = `${getBaseUrl()}/api/calculatedField`
	const response = await fetch(url, {
		method: 'POST',
		headers: authHeaders(),
		body: JSON.stringify(payload),
	})

	if (!response.ok) {
		const text = await response.text()
		throw new Error(
			`Failed to create calculated field: ${String(response.status)} ${text}`,
		)
	}

	return (await response.json()) as CalculatedFieldResponse
}

/**
 * Delete a calculated field by ID.
 */
export async function deleteCalculatedField(
	calculatedFieldId: string,
): Promise<void> {
	const url = `${getBaseUrl()}/api/calculatedField/${calculatedFieldId}`
	const response = await fetch(url, {
		method: 'DELETE',
		headers: authHeaders(),
	})

	if (!response.ok) {
		const text = await response.text()
		throw new Error(
			`Failed to delete calculated field: ${String(response.status)} ${text}`,
		)
	}
}

/**
 * Trigger reprocessing of a calculated field for a time range.
 * Uses GET /api/calculatedField/{id}/reprocess (TB PE endpoint).
 */
export async function reprocessCalculatedField(
	calculatedFieldId: string,
	startTs: number,
	endTs: number,
): Promise<void> {
	const url = `${getBaseUrl()}/api/calculatedField/${calculatedFieldId}/reprocess?startTs=${String(startTs)}&endTs=${String(endTs)}`
	const response = await fetch(url, { headers: authHeaders() })

	if (!response.ok) {
		const text = await response.text()
		throw new Error(
			`Failed to reprocess calculated field: ${String(response.status)} ${text}`,
		)
	}
}
