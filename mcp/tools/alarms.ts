import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import * as z from 'zod/v4'

import {
	ackAlarm,
	clearAlarm,
	getAlarmById,
	getAlarms,
} from '../../src/generated/sdk.gen'

/**
 * Registers alarm MCP tools on the server.
 *
 * Tools:
 *   tb_list_alarms  — List alarms for an entity with filters
 *   tb_get_alarm    — Get a single alarm by ID
 *   tb_ack_alarm    — Acknowledge an alarm
 *   tb_clear_alarm  — Clear an alarm
 */
export function registerAlarmTools(server: McpServer): void {
	server.tool(
		'tb_list_alarms',
		'List alarms for a ThingsBoard entity with optional status and time filters',
		{
			entityType: z
				.enum(['DEVICE', 'ASSET', 'ENTITY_VIEW'])
				.describe('Entity type'),
			entityId: z.string().describe('Entity UUID'),
			searchStatus: z
				.enum(['ANY', 'ACTIVE', 'CLEARED', 'ACK', 'UNACK'])
				.optional()
				.describe('Alarm search status filter'),
			pageSize: z
				.number()
				.optional()
				.describe('Max results (default: 50)'),
			sortProperty: z
				.enum([
					'createdTime',
					'startTs',
					'endTs',
					'type',
					'severity',
					'status',
				])
				.optional()
				.describe('Sort field (default: createdTime)'),
			sortOrder: z
				.enum(['ASC', 'DESC'])
				.optional()
				.describe('Sort order (default: DESC)'),
		},
		async ({
			entityType,
			entityId,
			searchStatus,
			pageSize,
			sortProperty,
			sortOrder,
		}) => {
			const { data, error } = await getAlarms({
				path: { entityType, entityId },
				query: {
					pageSize: pageSize ?? 50,
					page: 0,
					searchStatus,
					sortProperty: sortProperty ?? 'createdTime',
					sortOrder: sortOrder ?? 'DESC',
					fetchOriginator: true,
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
		'tb_get_alarm',
		'Get detailed information about a specific alarm by its ID',
		{
			alarmId: z.string().describe('UUID of the alarm'),
		},
		async ({ alarmId }) => {
			const { data, error } = await getAlarmById({
				path: { alarmId },
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
		'tb_ack_alarm',
		'Acknowledge an alarm by its ID',
		{
			alarmId: z.string().describe('UUID of the alarm to acknowledge'),
		},
		async ({ alarmId }) => {
			const { error } = await ackAlarm({
				path: { alarmId },
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
						text: `Acknowledged alarm ${alarmId}`,
					},
				],
			}
		},
	)

	server.tool(
		'tb_clear_alarm',
		'Clear an alarm by its ID',
		{
			alarmId: z.string().describe('UUID of the alarm to clear'),
		},
		async ({ alarmId }) => {
			const { error } = await clearAlarm({
				path: { alarmId },
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
						text: `Cleared alarm ${alarmId}`,
					},
				],
			}
		},
	)
}
