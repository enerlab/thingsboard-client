import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

import { initTbClient } from './tb-init'
import { registerCalculatedFieldTools } from './tools/calculated-fields'
import { registerTelemetryTools } from './tools/telemetry'

const server = new McpServer({
	name: 'tb-ops',
	version: '0.1.0',
	description:
		'ThingsBoard PE operations — calculated fields, rule chains, alarms, and more',
})

// Register tool modules
registerCalculatedFieldTools(server)
registerTelemetryTools(server)
// Future: registerRuleChainTools(server)
// Future: registerAlarmTools(server)
// Future: registerDeviceTools(server)

// Initialize ThingsBoard client and start MCP server
await initTbClient()

const transport = new StdioServerTransport()
await server.connect(transport)
console.error('tb-ops MCP server running')
