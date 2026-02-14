import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Removed Firebase Admin - switching to local-only stub
console.error(
	"OpenNote MCP Server: Running in local-only mode (Firebase removed)",
);

const mcpServer = new McpServer(
	{
		name: "opennote-mcp-local",
		version: "1.0.0",
	},
	{
		capabilities: {
			tools: {},
		},
	},
);

const server = mcpServer.server;

server.setRequestHandler(ListToolsRequestSchema, async () => {
	return {
		tools: [
			{
				name: "ping",
				description: "Check connection",
				inputSchema: { type: "object", properties: {} },
			},
		],
	};
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
	const { name } = request.params;
	if (name === "ping") return { content: [{ type: "text", text: "pong" }] };

	return {
		content: [
			{
				type: "text",
				text: "Firebase is removed. This MCP server is now a stub. To access local notes, point the MCP server to a local database file or the app's export.",
			},
		],
		isError: true,
	};
});

async function main() {
	const transport = new StdioServerTransport();
	await mcpServer.connect(transport);
	console.error("OpenNote MCP Server ready on stdio");
}

main().catch((error) => {
	console.error("Server error:", error);
	process.exit(1);
});
