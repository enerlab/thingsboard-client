import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import * as z from 'zod/v4'

import { findByQuery, findInfoByQuery } from '../../src/generated/sdk.gen'

/**
 * Registers relation MCP tools on the server.
 *
 * Tools:
 *   tb_get_relations_from — Get all relations FROM an entity (e.g. asset → devices)
 *   tb_get_relations_to   — Get all relations TO an entity
 *   tb_find_relations      — Advanced relation query with filters
 */
export function registerRelationTools(server: McpServer): void {
	server.tool(
		'tb_get_relations_from',
		'Get all relations FROM an entity (e.g. find child devices of an asset). Returns entity names.',
		{
			fromId: z.string().describe('UUID of the source entity'),
			fromType: z
				.enum(['DEVICE', 'ASSET', 'ENTITY_VIEW', 'CUSTOMER', 'TENANT'])
				.describe('Source entity type'),
			relationTypeGroup: z
				.string()
				.optional()
				.describe('Relation group (default: COMMON)'),
		},
		async ({ fromId, fromType, relationTypeGroup }) => {
			const { data, error } = await findInfoByQuery({
				body: {
					parameters: {
						rootId: fromId,
						rootType: fromType,
						direction: 'FROM',
						relationTypeGroup:
							(relationTypeGroup as 'COMMON' | undefined) ?? 'COMMON',
						maxLevel: 1,
						fetchLastLevelOnly: false,
					},
				},
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
		'tb_get_relations_to',
		'Get all relations TO an entity (e.g. find parent assets of a device). Returns entity names.',
		{
			toId: z.string().describe('UUID of the target entity'),
			toType: z
				.enum(['DEVICE', 'ASSET', 'ENTITY_VIEW', 'CUSTOMER', 'TENANT'])
				.describe('Target entity type'),
			relationTypeGroup: z
				.string()
				.optional()
				.describe('Relation group (default: COMMON)'),
		},
		async ({ toId, toType, relationTypeGroup }) => {
			const { data, error } = await findInfoByQuery({
				body: {
					parameters: {
						rootId: toId,
						rootType: toType,
						direction: 'TO',
						relationTypeGroup:
							(relationTypeGroup as 'COMMON' | undefined) ?? 'COMMON',
						maxLevel: 1,
						fetchLastLevelOnly: false,
					},
				},
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
		'tb_find_relations',
		'Find relations using an advanced query with direction, type filter, and depth. Use for multi-hop traversal.',
		{
			rootId: z.string().describe('UUID of the root entity'),
			rootType: z
				.enum(['DEVICE', 'ASSET', 'ENTITY_VIEW', 'CUSTOMER', 'TENANT'])
				.describe('Root entity type'),
			direction: z
				.enum(['FROM', 'TO'])
				.describe('Relation direction from the root entity'),
			relationType: z
				.string()
				.optional()
				.describe(
					'Filter by relation type (e.g. "Contains", "Manages")',
				),
			maxLevel: z
				.number()
				.optional()
				.describe('Max traversal depth (default: 1)'),
		},
		async ({ rootId, rootType, direction, relationType, maxLevel }) => {
			const filters = relationType
				? [
						{
							relationType,
							entityTypes: [] as ('DEVICE' | 'ASSET')[],
						},
					]
				: []

			const { data, error } = await findByQuery({
				body: {
					parameters: {
						rootId,
						rootType,
						direction,
						maxLevel: maxLevel ?? 1,
						fetchLastLevelOnly: false,
					},
					filters,
				},
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
}
