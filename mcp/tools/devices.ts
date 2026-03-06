import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import * as z from 'zod/v4'

import {
	getAttributesByScope,
	getDeviceById,
	getDeviceInfoById,
	getTenantDevices,
} from '../../src/generated/sdk.gen'

/**
 * Registers device MCP tools on the server.
 *
 * Tools:
 *   tb_get_device        — Get device by ID
 *   tb_get_device_info   — Get device info (includes profile name, customer)
 *   tb_list_devices      — List tenant devices with search
 *   tb_get_device_attributes — Get attributes by scope
 */
export function registerDeviceTools(server: McpServer): void {
	server.tool(
		'tb_get_device',
		'Get a device by its ID',
		{
			deviceId: z.string().describe('UUID of the device'),
		},
		async ({ deviceId }) => {
			const { data, error } = await getDeviceById({
				path: { deviceId },
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
		'tb_get_device_info',
		'Get device info including profile name and customer title',
		{
			deviceId: z.string().describe('UUID of the device'),
		},
		async ({ deviceId }) => {
			const { data, error } = await getDeviceInfoById({
				path: { deviceId },
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
		'tb_list_devices',
		'List tenant devices with optional text search and device type filter',
		{
			textSearch: z
				.string()
				.optional()
				.describe('Filter devices by name'),
			type: z
				.string()
				.optional()
				.describe('Filter by device profile name'),
			pageSize: z
				.number()
				.optional()
				.describe('Max results (default: 50)'),
		},
		async ({ textSearch, type, pageSize }) => {
			const { data, error } = await getTenantDevices({
				query: {
					pageSize: pageSize ?? 50,
					page: 0,
					type,
					textSearch,
					sortProperty: 'name',
					sortOrder: 'ASC',
					deviceName: textSearch ?? '',
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
		'tb_get_device_attributes',
		'Get device attributes by scope (SERVER_SCOPE, SHARED_SCOPE, or CLIENT_SCOPE)',
		{
			deviceId: z.string().describe('UUID of the device'),
			scope: z
				.enum(['SERVER_SCOPE', 'SHARED_SCOPE', 'CLIENT_SCOPE'])
				.describe('Attribute scope'),
			keys: z
				.string()
				.optional()
				.describe('Comma-separated attribute keys to fetch. Omit for all.'),
		},
		async ({ deviceId, scope, keys }) => {
			const { data, error } = await getAttributesByScope({
				path: {
					entityType: 'DEVICE',
					entityId: deviceId,
					scope,
				},
				query: { keys, params: {} },
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
