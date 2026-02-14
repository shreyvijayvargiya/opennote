import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

async function testConnection() {
	const apiKey = process.env.OpenNote_API_KEY;
	const baseUrl = process.env.OpenNote_URL || "http://localhost:3000";

	if (!apiKey) {
		console.error(
			"❌ Error: OpenNote_API_KEY environment variable is required.",
		);
		console.log(
			"Usage: OpenNote_API_KEY=your_key node mcp-server/test-connection.js",
		);
		process.exit(1);
	}

	console.log(`\n--- MCP Connection Test (Streamable HTTP) ---`);
	console.log(`URL: ${baseUrl}/api/mcp`);
	console.log(`API Key: ...${apiKey.slice(-4)}`);

	const url = new URL(`${baseUrl}/api/mcp`);
	url.searchParams.set("apiKey", apiKey);

	// Use the modern StreamableHTTPClientTransport instead of the deprecated SSEClientTransport
	const transport = new StreamableHTTPClientTransport(url);
	const client = new Client(
		{ name: "test-client", version: "1.0.0" },
		{ capabilities: {} },
	);

	try {
		console.log("Connecting...");
		await client.connect(transport);
		console.log("✅ Connected successfully!");

		console.log("Fetching tools...");
		const tools = await client.listTools();
		console.log("✅ Tools received:");
		console.log(JSON.stringify(tools, null, 2));

		if (tools.tools.some((t) => t.name === "ping")) {
			console.log("\nTesting 'ping' tool...");
			const result = await client.callTool({ name: "ping", arguments: {} });
			console.log("✅ Ping result:", JSON.stringify(result, null, 2));
		}

		console.log("\n--- Test Completed Successfully ---");
		process.exit(0);
	} catch (error) {
		console.error("\n❌ Test Failed!");
		console.error("Error Message:", error.message);
		if (error.stack) console.error("Stack Trace:", error.stack);
		process.exit(1);
	}
}

testConnection();
