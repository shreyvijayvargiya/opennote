import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
	ListToolsRequestSchema,
	CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log file for debugging
const LOG_FILE = path.join(__dirname, "..", "mcp-bridge.log");
const logStream = fs.createWriteStream(LOG_FILE, { flags: "a" });

function log(message) {
	const timestamp = new Date().toISOString();
	const logMessage = `[${timestamp}] ${message}\n`;
	logStream.write(logMessage);
	console.error(message);
}

async function main() {
	const apiKey = process.env.OpenNote_API_KEY;
	const baseUrl = process.env.OpenNote_URL || "http://localhost:3000";

	log(`[Bridge] Starting bridge process (PID: ${process.pid})`);
	log(`[Bridge] Base URL: ${baseUrl}`);
	log(`[Bridge] API Key presence: ${apiKey ? "Yes" : "No"}`);

	if (!apiKey) {
		log("[Bridge] Error: OpenNote_API_KEY environment variable is required.");
		process.exit(1);
	}

	const mcpServer = new McpServer(
		{ name: "opennote-bridge", version: "1.0.0" },
		{ capabilities: { tools: {} } },
	);

	const localServer = mcpServer.server;

	let hostedClient = null;
	let hostedTransport = null;

	const getHostedClient = async () => {
		if (hostedClient) return hostedClient;

		log("[Bridge] Initiating Streamable HTTP connection to hosted server...");
		const url = new URL(`${baseUrl}/api/mcp`);
		url.searchParams.set("apiKey", apiKey);

		// Using modern StreamableHTTPClientTransport
		hostedTransport = new StreamableHTTPClientTransport(url);
		const client = new Client(
			{ name: "opennote-bridge-client", version: "1.0.0" },
			{ capabilities: {} },
		);

		try {
			await client.connect(hostedTransport);
			log(
				"[Bridge] Connected to hosted server via Streamable HTTP successfully",
			);
			hostedClient = client;
			return hostedClient;
		} catch (error) {
			log(`[Bridge] Hosted connection failed: ${error.message}`);
			hostedClient = null;
			throw error;
		}
	};

	// Proxy tool listing
	localServer.setRequestHandler(ListToolsRequestSchema, async () => {
		log("[Bridge] Claude requested tools listing...");
		try {
			const client = await getHostedClient();
			const tools = await client.listTools();
			log(
				`[Bridge] Fetched ${tools.tools?.length || 0} tools from hosted server`,
			);
			return tools;
		} catch (err) {
			log(`[Bridge] Error fetching tools: ${err.message}`);
			throw err;
		}
	});

	// Proxy tool calls
	localServer.setRequestHandler(CallToolRequestSchema, async (request) => {
		log(`[Bridge] Claude calling tool: ${request.params.name}`);
		try {
			const client = await getHostedClient();
			const result = await client.callTool({
				name: request.params.name,
				arguments: request.params.arguments,
			});
			log(`[Bridge] Tool call result received for ${request.params.name}`);
			return result;
		} catch (err) {
			log(`[Bridge] Error calling tool ${request.params.name}: ${err.message}`);
			throw err;
		}
	});

	// Connect to Claude via Stdio
	const stdioTransport = new StdioServerTransport();
	log("[Bridge] Connecting to Claude via Stdio...");
	await mcpServer.connect(stdioTransport);
	log("[Bridge] Bridge ready and listening for Claude requests");
}

main().catch((err) => {
	log(`[Bridge] Unhandled main error: ${err.message}`);
	process.exit(1);
});
