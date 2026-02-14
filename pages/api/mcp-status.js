export default async function handler(req, res) {
	try {
		const sessions = global.mcpSessions || new Map();
		const activeSessions = Array.from(sessions.entries()).map(([id, session]) => ({
			id,
			userId: session.userId,
			lastSeen: session.lastSeen,
			connected: Date.now() - session.lastSeen < 30000, // Active if seen in last 30s
		}));

		res.status(200).json({
			connected: activeSessions.length > 0,
			sessions: activeSessions,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}
