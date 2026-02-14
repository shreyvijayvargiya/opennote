import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
	ListToolsRequestSchema,
	CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { v4 as uuidv4 } from "uuid";

// Disable bodyParser to let the MCP SDK handle the raw request stream
export const config = {
	api: {
		bodyParser: false,
	},
};

// Registry for active sessions
if (!global.mcpSessions) {
	global.mcpSessions = new Map();
}

// Cleanup stale sessions every 5 minutes
if (!global.mcpCleanupStarted) {
	setInterval(
		() => {
			const now = Date.now();
			const timeout = 1000 * 60 * 15; // 15 minutes
			for (const [sid, session] of global.mcpSessions.entries()) {
				if (now - session.lastSeen > timeout) {
					console.log(`[MCP Server] Cleaning up stale session: ${sid}`);
					global.mcpSessions.delete(sid);
				}
			}
		},
		1000 * 60 * 5,
	);
	global.mcpCleanupStarted = true;
}

export default async function handler(req, res) {
	try {
		const host = req.headers.host || "localhost:3000";
		const protocol = host.includes("localhost") ? "http" : "https";
		const urlObj = new URL(req.url, `${protocol}://${host}`);

		const sessionId =
			urlObj.searchParams.get("sessionId") ||
			req.headers["mcp-session-id"] ||
			urlObj.searchParams.get("sid");

		console.log(
			`[MCP Server] Request: ${req.method} ${req.url} (Session: ${sessionId || "new"})`,
		);

		if (sessionId) {
			const session = global.mcpSessions.get(sessionId);
			if (session) {
				session.lastSeen = Date.now();
				return await session.transport.handleRequest(req, res);
			} else {
				console.warn(`[MCP Server] Session not found: ${sessionId}`);
				return res.status(404).json({ error: "Session not found" });
			}
		}

		// Authenticate - for local version, we'll allow any non-empty API key
		const apiKey =
			urlObj.searchParams.get("apiKey") || req.headers["x-api-key"];

		if (!apiKey) {
			console.error("[MCP Server] Missing API Key for new session");
			return res.status(401).json({ error: "Missing API Key" });
		}

		const userId = "local-user";
		console.log(`[MCP Server] Authenticating new session for local user`);

		const mcpServer = new McpServer(
			{ name: "opennote-hosted-local", version: "1.0.0" },
			{ capabilities: { tools: {} } },
		);

		// Define Tools
		mcpServer.server.setRequestHandler(ListToolsRequestSchema, async () => {
			return {
				tools: [
					{
						name: "list_notes",
						description: "List all notes",
						inputSchema: { type: "object", properties: {} },
					},
					{
						name: "get_note",
						description: "Get note content",
						inputSchema: {
							type: "object",
							properties: { noteId: { type: "string" } },
							required: ["noteId"],
						},
					},
					{
						name: "ping",
						description: "Check connection",
						inputSchema: { type: "object", properties: {} },
					},
				],
			};
		});

		mcpServer.server.setRequestHandler(
			CallToolRequestSchema,
			async (request) => {
				const { name, arguments: args } = request.params;
				if (name === "ping")
					return { content: [{ type: "text", text: "pong" }] };

				// For a purely local app, server-side MCP is limited unless it can access local storage.
				// We return a message explaining this for now.
				return {
					content: [
						{
							type: "text",
							text: "This application is now running in local-only mode. Server-side MCP tools are disabled. Please use the local stdio MCP server for direct note access.",
						},
					],
				};
			},
		);

		const newSessionId = uuidv4();
		const transport = new StreamableHTTPServerTransport({
			sessionIdGenerator: () => newSessionId,
		});

		await mcpServer.connect(transport);

		global.mcpSessions.set(newSessionId, {
			mcpServer,
			transport,
			userId,
			lastSeen: Date.now(),
		});

		await transport.handleRequest(req, res);
	} catch (error) {
		console.error("[MCP Server] Fatal Error:", error);
		if (!res.headersSent) {
			res.status(500).json({ error: error.message || "Internal Server Error" });
		}
	}
}
