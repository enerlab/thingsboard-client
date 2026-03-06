import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import * as z from 'zod/v4'

import {
	getRuleChainById,
	getRuleChainMetaData,
	saveRuleChainMetaData,
} from '../../src/generated/sdk.gen'
import { listRuleChains } from '../pe-api/rule-chains'

/**
 * Registers rule chain MCP tools on the server.
 *
 * Tools:
 *   tb_list_rule_chains        — List all rule chains
 *   tb_get_rule_chain          — Get a rule chain by ID
 *   tb_get_rule_chain_metadata — Get nodes + connections for a rule chain
 *   tb_update_rule_chain_node  — Update a specific node's configuration
 */
export function registerRuleChainTools(server: McpServer): void {
	server.tool(
		'tb_list_rule_chains',
		'List all rule chains in the ThingsBoard tenant',
		{
			type: z
				.enum(['CORE', 'EDGE'])
				.optional()
				.describe('Rule chain type (default: CORE)'),
		},
		async ({ type }) => {
			const chains = await listRuleChains(
				(type as 'CORE' | 'EDGE') ?? 'CORE',
			)
			return {
				content: [
					{
						type: 'text' as const,
						text: JSON.stringify(chains, undefined, 2),
					},
				],
			}
		},
	)

	server.tool(
		'tb_get_rule_chain',
		'Get a rule chain by its ID',
		{
			ruleChainId: z.string().describe('UUID of the rule chain'),
		},
		async ({ ruleChainId }) => {
			const { data, error } = await getRuleChainById({
				path: { ruleChainId },
			})
			if (error) {
				return {
					content: [
						{
							type: 'text' as const,
							text: `Error: ${JSON.stringify(error)}`,
						},
					],
					isError: true,
				}
			}
			return {
				content: [
					{
						type: 'text' as const,
						text: JSON.stringify(data, undefined, 2),
					},
				],
			}
		},
	)

	server.tool(
		'tb_get_rule_chain_metadata',
		'Get the metadata (nodes + connections) of a rule chain. CRITICAL: POST to save replaces ALL nodes.',
		{
			ruleChainId: z.string().describe('UUID of the rule chain'),
		},
		async ({ ruleChainId }) => {
			const { data, error } = await getRuleChainMetaData({
				path: { ruleChainId },
			})
			if (error) {
				return {
					content: [
						{
							type: 'text' as const,
							text: `Error: ${JSON.stringify(error)}`,
						},
					],
					isError: true,
				}
			}
			return {
				content: [
					{
						type: 'text' as const,
						text: JSON.stringify(data, undefined, 2),
					},
				],
			}
		},
	)

	server.tool(
		'tb_update_rule_chain_node',
		'Update a specific node configuration in a rule chain. Finds the node by name, applies the patch, and saves the full metadata back.',
		{
			ruleChainId: z.string().describe('UUID of the rule chain'),
			nodeName: z
				.string()
				.describe(
					'Name of the node to update (e.g. "Format WhatsApp Message")',
				),
			configurationPatch: z
				.string()
				.describe(
					'JSON string with configuration fields to merge into the node configuration',
				),
		},
		async ({ ruleChainId, nodeName, configurationPatch }) => {
			const { data: metadata, error } = await getRuleChainMetaData({
				path: { ruleChainId },
			})
			if (error || !metadata) {
				return {
					content: [
						{
							type: 'text' as const,
							text: `Error fetching metadata: ${JSON.stringify(error)}`,
						},
					],
					isError: true,
				}
			}

			const nodes = (metadata as Record<string, unknown>).nodes as
				| Array<Record<string, unknown>>
				| undefined
			if (!nodes) {
				return {
					content: [
						{
							type: 'text' as const,
							text: 'Error: metadata has no nodes array',
						},
					],
					isError: true,
				}
			}

			const node = nodes.find(
				(n: Record<string, unknown>) => n.name === nodeName,
			)
			if (!node) {
				const names = nodes.map(
					(n: Record<string, unknown>) => n.name,
				)
				return {
					content: [
						{
							type: 'text' as const,
							text: `Node "${nodeName}" not found. Available nodes: ${JSON.stringify(names)}`,
						},
					],
					isError: true,
				}
			}

			const patch = JSON.parse(configurationPatch) as Record<
				string,
				unknown
			>
			node.configuration = {
				...(node.configuration as Record<string, unknown>),
				...patch,
			}

			const { error: saveError } = await saveRuleChainMetaData({
				body: metadata as Parameters<
					typeof saveRuleChainMetaData
				>[0]['body'],
			})
			if (saveError) {
				return {
					content: [
						{
							type: 'text' as const,
							text: `Error saving metadata: ${JSON.stringify(saveError)}`,
						},
					],
					isError: true,
				}
			}

			return {
				content: [
					{
						type: 'text' as const,
						text: `Updated node "${nodeName}" in rule chain ${ruleChainId}`,
					},
				],
			}
		},
	)
}
