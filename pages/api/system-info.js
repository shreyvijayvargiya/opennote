import path from "path";

export default function handler(req, res) {
	try {
		const workspacePath = process.cwd();
		res.status(200).json({ 
			workspacePath,
			connectScriptPath: path.join(workspacePath, "mcp-server", "connect.js")
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}
