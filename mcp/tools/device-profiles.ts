import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import * as z from 'zod/v4'

import {
	getDeviceProfileById,
	getDeviceProfiles,
	saveDeviceProfile,
} from '../../src/generated/sdk.gen'

/**
 * Registers device profile MCP tools on the server.
 *
 * Tools:
 *   tb_list_device_profiles — List device profiles with optional search
 *   tb_get_device_profile   — Get a device profile by ID (includes alarm rules)
 *   tb_save_device_profile  — Save/update a device profile (full upsert)
 */
export function registerDeviceProfileTools(server: McpServer): void {
	server.tool(
		'tb_list_device_profiles',
		'List device profiles in the ThingsBoard tenant with optional text search',
		{
			textSearch: z
				.string()
				.optional()
				.describe('Filter by device profile name'),
			pageSize: z
				.number()
				.optional()
				.describe('Max results per page (default: 50)'),
		},
		async ({ textSearch, pageSize }) => {
			const { data, error } = await getDeviceProfiles({
				query: {
					pageSize: pageSize ?? 50,
					page: 0,
					textSearch,
					sortProperty: 'name',
					sortOrder: 'ASC',
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
		'tb_get_device_profile',
		'Get a device profile by ID. Returns the full profile including alarm rules in profileData.alarms.',
		{
			deviceProfileId: z.string().describe('UUID of the device profile'),
		},
		async ({ deviceProfileId }) => {
			const { data, error } = await getDeviceProfileById({
				path: { deviceProfileId },
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
		'tb_save_device_profile',
		'Save (create or update) a device profile. Send the FULL profile object — this is an upsert that replaces the entire profile.',
		{
			deviceProfile: z
				.string()
				.describe(
					'Full device profile JSON string. Must include id for update, omit for create. Includes profileData with alarm rules, transport config, etc.',
				),
		},
		async ({ deviceProfile }) => {
			const profile = JSON.parse(deviceProfile) as Record<string, unknown>
			const { data, error } = await saveDeviceProfile({
				body: profile as Parameters<typeof saveDeviceProfile>[0]['body'],
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
						text: `Saved device profile "${(data as Record<string, unknown>)?.name ?? 'unknown'}" successfully`,
					},
				],
			}
		},
	)
}
