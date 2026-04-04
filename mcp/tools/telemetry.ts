import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import * as z from 'zod/v4'

import {
	deleteEntityTimeseries,
	getLatestTimeseries,
	saveEntityTelemetry,
} from '../../src/generated/sdk.gen'

/**
 * Registers telemetry MCP tools on the server.
 *
 * Tools:
 *   tb_get_latest_telemetry  — Get latest telemetry values
 *   tb_get_timeseries        — Get historical timeseries data
 *   tb_save_telemetry        — Push telemetry to an entity
 *   tb_delete_timeseries     — Delete timeseries data
 */
export function registerTelemetryTools(server: McpServer): void {
	server.tool(
		'tb_get_latest_telemetry',
		'Get the latest telemetry values for a ThingsBoard entity',
		{
			entityType: z
				.enum(['DEVICE', 'ASSET', 'ENTITY_VIEW'])
				.describe('Entity type'),
			entityId: z.string().describe('Entity UUID'),
			keys: z
				.string()
				.optional()
				.describe('Comma-separated telemetry keys. Omit for all.'),
		},
		async ({ entityType, entityId, keys }) => {
			const { data, error } = await getLatestTimeseries({
				path: { entityType, entityId },
				query: {
					keys,
					useStrictDataTypes: true,
					params: {},
					startTs: 0,
					endTs: Date.now(),
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
		'tb_get_timeseries',
		'Get historical timeseries data for an entity within a time range',
		{
			entityType: z
				.enum(['DEVICE', 'ASSET', 'ENTITY_VIEW'])
				.describe('Entity type'),
			entityId: z.string().describe('Entity UUID'),
			keys: z
				.string()
				.describe('Comma-separated telemetry keys'),
			startDate: z
				.string()
				.describe('Start date (YYYY-MM-DD or ISO 8601)'),
			endDate: z
				.string()
				.describe('End date (YYYY-MM-DD or ISO 8601)'),
			limit: z
				.number()
				.optional()
				.describe('Max data points per key (default: 100)'),
			agg: z
				.enum(['MIN', 'MAX', 'AVG', 'SUM', 'COUNT', 'NONE'])
				.optional()
				.describe('Aggregation function (default: NONE)'),
			interval: z
				.number()
				.optional()
				.describe('Aggregation interval in milliseconds (required when agg is not NONE)'),
			orderBy: z
				.enum(['ASC', 'DESC'])
				.optional()
				.describe('Sort order (default: DESC)'),
		},
		async ({
			entityType,
			entityId,
			keys,
			startDate,
			endDate,
			limit,
			agg,
			interval,
			orderBy,
		}) => {
			const startTs = new Date(startDate).getTime()
			const endTs = new Date(endDate).getTime()

			const { data, error } = await getLatestTimeseries({
				path: { entityType, entityId },
				query: {
					keys,
					startTs,
					endTs,
					limit: String(limit ?? 100),
					agg,
					interval,
					orderBy,
					useStrictDataTypes: true,
					params: {},
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
		'tb_save_telemetry',
		'Push telemetry data to a ThingsBoard entity',
		{
			entityType: z
				.enum(['DEVICE', 'ASSET'])
				.describe('Entity type'),
			entityId: z.string().describe('Entity UUID'),
			telemetry: z
				.string()
				.describe(
					'JSON string with telemetry key-value pairs, e.g. {"temperature": 25.5, "humidity": 60}',
				),
		},
		async ({ entityType, entityId, telemetry }) => {
			const { error } = await saveEntityTelemetry({
				path: { entityType, entityId, scope: 'ANY' },
				body: telemetry,
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
						text: `Telemetry saved for ${entityType} ${entityId}`,
					},
				],
			}
		},
	)

	server.tool(
		'tb_delete_timeseries',
		'Delete timeseries data for specific keys within an optional time range',
		{
			entityType: z
				.enum(['DEVICE', 'ASSET'])
				.describe('Entity type'),
			entityId: z.string().describe('Entity UUID'),
			keys: z
				.string()
				.describe('Comma-separated telemetry keys to delete'),
			deleteAllDataForKeys: z
				.boolean()
				.optional()
				.describe('Delete ALL data for these keys (default: false)'),
			startDate: z
				.string()
				.optional()
				.describe('Start date for range deletion (YYYY-MM-DD)'),
			endDate: z
				.string()
				.optional()
				.describe('End date for range deletion (YYYY-MM-DD)'),
		},
		async ({
			entityType,
			entityId,
			keys,
			deleteAllDataForKeys,
			startDate,
			endDate,
		}) => {
			const { error } = await deleteEntityTimeseries({
				path: { entityType, entityId },
				query: {
					keys,
					deleteAllDataForKeys,
					startTs: startDate
						? new Date(startDate).getTime()
						: undefined,
					endTs: endDate
						? new Date(endDate).getTime()
						: undefined,
					params: {},
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
						text: `Deleted timeseries keys [${keys}] for ${entityType} ${entityId}`,
					},
				],
			}
		},
	)
}
