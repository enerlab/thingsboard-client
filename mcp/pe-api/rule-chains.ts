import { getAuthToken, getBaseUrl } from '../tb-init'

/**
 * PE API wrapper for listing rule chains.
 * The generated SDK only has getRuleChainsByIds (requires IDs upfront).
 * This wrapper calls GET /api/ruleChains?pageSize=...&page=... directly.
 */

interface RuleChainListItem {
	id: { id: string; entityType: string }
	name: string
	type: string
	root: boolean
	debugMode: boolean
	configuration: Record<string, unknown>
}

interface RuleChainPage {
	data: RuleChainListItem[]
	totalPages: number
	totalElements: number
	hasNext: boolean
}

function authHeaders(): Record<string, string> {
	return {
		'X-Authorization': `Bearer ${getAuthToken()}`,
		'Content-Type': 'application/json',
	}
}

export async function listRuleChains(
	type: 'CORE' | 'EDGE' = 'CORE',
): Promise<RuleChainListItem[]> {
	const url = `${getBaseUrl()}/api/ruleChains?pageSize=100&page=0&type=${type}`
	const response = await fetch(url, { headers: authHeaders() })

	if (!response.ok) {
		const text = await response.text()
		throw new Error(
			`Failed to list rule chains: ${String(response.status)} ${text}`,
		)
	}

	const data = (await response.json()) as RuleChainPage
	return data.data ?? []
}
