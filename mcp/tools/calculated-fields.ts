import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import * as z from 'zod/v4'

import {
	createCalculatedField,
	deleteCalculatedField,
	getCalculatedFields,
	reprocessCalculatedField,
} from '../pe-api/calculated-fields'

/**
 * Registers calculated field MCP tools on the server.
 *
 * Tools:
 *   tb_list_calculated_fields   — List calculated fields for an entity
 *   tb_create_calculated_field  — Create a new calculated field
 *   tb_delete_calculated_field  — Delete a calculated field by ID
 *   tb_reprocess_calculated_field — Reprocess historical data
 */
export function registerCalculatedFieldTools(server: McpServer): void {
	// --- List ---
	server.tool(
		'tb_list_calculated_fields',
		'List all calculated fields for a ThingsBoard entity (device or asset)',
		{
			entityType: z
				.enum(['DEVICE', 'ASSET'])
				.describe('Entity type'),
			entityId: z.string().describe('Entity UUID'),
		},
		async ({ entityType, entityId }) => {
			const fields = await getCalculatedFields(entityType, entityId)
			return {
				content: [
					{
						type: 'text' as const,
						text: JSON.stringify(fields, null, 2),
					},
				],
			}
		},
	)

	// --- Create ---
	server.tool(
		'tb_create_calculated_field',
		'Create a calculated field on a ThingsBoard entity using a TBEL expression',
		{
			entityType: z
				.enum(['DEVICE', 'ASSET'])
				.describe('Entity type to attach the calculated field to'),
			entityId: z
				.string()
				.describe('Entity UUID'),
			name: z
				.string()
				.describe('Name of the calculated field (e.g. "dtAG_ON")'),
			expression: z
				.string()
				.describe(
					'TBEL script expression. Example: if (kW > 10) { return {"dtAG_ON": dtAG}; } return {};',
				),
			arguments: z
				.array(
					z.object({
						name: z
							.string()
							.describe(
								'Argument name used in the expression (e.g. "kW")',
							),
						key: z
							.string()
							.describe(
								'Telemetry/attribute key to bind (e.g. "kW")',
							),
						type: z
							.enum(['TS_LATEST', 'TS_ROLLING', 'ATTRIBUTE'])
							.describe('Data source type'),
						refEntityId: z
							.string()
							.optional()
							.describe(
								'UUID of another entity to reference (cross-device). Omit if same entity.',
							),
						refEntityType: z
							.string()
							.optional()
							.describe(
								'Type of the referenced entity (default: DEVICE)',
							),
						defaultValue: z
							.string()
							.optional()
							.describe('Default value if source is unavailable'),
					}),
				)
				.describe('List of arguments consumed by the expression'),
			outputType: z
				.enum(['TIME_SERIES', 'ATTRIBUTES'])
				.optional()
				.describe(
					'Where to store the result (default: TIME_SERIES)',
				),
		},
		async (input) => {
			const result = await createCalculatedField({
				entityType: input.entityType,
				entityId: input.entityId,
				name: input.name,
				expression: input.expression,
				arguments: input.arguments.map((arg) => ({
					...arg,
					type: arg.type as 'TS_LATEST' | 'TS_ROLLING' | 'ATTRIBUTE',
				})),
				outputType: input.outputType as 'TIME_SERIES' | 'ATTRIBUTES' | undefined,
			})
			return {
				content: [
					{
						type: 'text' as const,
						text: `Created calculated field "${result.name}" (id: ${result.id.id})`,
					},
				],
			}
		},
	)

	// --- Delete ---
	server.tool(
		'tb_delete_calculated_field',
		'Delete a calculated field by its ID',
		{
			calculatedFieldId: z
				.string()
				.describe('UUID of the calculated field to delete'),
		},
		async ({ calculatedFieldId }) => {
			await deleteCalculatedField(calculatedFieldId)
			return {
				content: [
					{
						type: 'text' as const,
						text: `Deleted calculated field ${calculatedFieldId}`,
					},
				],
			}
		},
	)

	// --- Reprocess ---
	server.tool(
		'tb_reprocess_calculated_field',
		'Reprocess historical data for a calculated field over a date range',
		{
			calculatedFieldId: z
				.string()
				.describe('UUID of the calculated field to reprocess'),
			startDate: z
				.string()
				.describe('Start date (YYYY-MM-DD)'),
			endDate: z
				.string()
				.describe('End date (YYYY-MM-DD)'),
		},
		async ({ calculatedFieldId, startDate, endDate }) => {
			const startTs = new Date(startDate).getTime()
			const endTs = new Date(endDate).getTime()

			if (startTs > endTs) {
				return {
					content: [
						{
							type: 'text' as const,
							text: 'Error: startDate must be before endDate',
						},
					],
					isError: true,
				}
			}

			await reprocessCalculatedField(calculatedFieldId, startTs, endTs)
			return {
				content: [
					{
						type: 'text' as const,
						text: `Reprocessing triggered for ${calculatedFieldId} from ${startDate} to ${endDate}`,
					},
				],
			}
		},
	)
}
