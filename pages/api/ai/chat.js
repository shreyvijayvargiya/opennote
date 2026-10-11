import { clip, slimHtml, MAX_DOCUMENT_CHARS, MAX_HISTORY_MESSAGES, MAX_IMAGES, MAX_MESSAGE_CHARS, MAX_NEARBY_CHARS, MAX_SELECTION_CHARS } from "../../../lib/ai/limits";
import { buildDocumentContext, buildSystemPrompt } from "../../../lib/ai/prompts";
import { resolveModel } from "../../../lib/ai/models";
import { LOCAL_TOOL_NAMES, LOCAL_TOOLS } from "../../../lib/ai/tools";

export const config = {
	api: {
		bodyParser: {
			sizeLimit: "6mb",
		},
	},
};

const IMAGE_PATTERN = /^data:image\/(png|jpeg|jpg|gif|webp);base64,[a-zA-Z0-9+/=\s]+$/;

function publicError(status, error) {
	return { status, error };
}

function friendlyUpstreamError(status, bodyText) {
	if (status === 401) return "OpenRouter rejected the API key.";
	if (status === 402) return "The OpenRouter account has no credits.";
	if (status === 429) return "OpenRouter rate limit reached. Try again in a moment.";
	if (status === 400) return "OpenRouter rejected the request.";
	if (bodyText && bodyText.length < 180 && !bodyText.includes("sk-")) {
		return "The AI request failed.";
	}
	return "The AI request failed.";
}

function sanitizeNote(note) {
	if (!note || typeof note !== "object") return null;
	return {
		id: note.id ?? null,
		title: clip(note.title || "Untitled", 500),
		html: clip(slimHtml(note.html || ""), MAX_DOCUMENT_CHARS),
		text: clip(note.text || "", MAX_DOCUMENT_CHARS),
		updatedAt: typeof note.updatedAt === "number" ? note.updatedAt : null,
	};
}

function sanitizeSelection(selection) {
	if (!selection || typeof selection !== "object") return null;
	const text = clip(selection.text || "", MAX_SELECTION_CHARS).trim();
	if (!text) return null;
	const from = Number(selection.from);
	const to = Number(selection.to);
	return {
		text,
		from: Number.isFinite(from) ? from : null,
		to: Number.isFinite(to) ? to : null,
		nearby: clip(selection.nearby || "", MAX_NEARBY_CHARS),
	};
}

function sanitizeImages(images) {
	if (!Array.isArray(images)) return [];
	return images
		.filter((image) => image && IMAGE_PATTERN.test(String(image.dataUrl || "")))
		.slice(0, MAX_IMAGES)
		.map((image) => ({
			name: clip(image.name || "image", 80),
			dataUrl: String(image.dataUrl).slice(0, 1_200_000),
		}));
}

function sanitizeToolCalls(toolCalls) {
	if (!Array.isArray(toolCalls)) return [];
	return toolCalls
		.filter((call) => call && LOCAL_TOOL_NAMES.includes(call.name) && typeof call.id === "string")
		.slice(0, 6)
		.map((call) => ({
			id: clip(call.id, 80),
			name: call.name,
			arguments:
				call.arguments && typeof call.arguments === "object" && !Array.isArray(call.arguments)
					? call.arguments
					: {},
		}));
}

function sanitizeMessages(messages) {
	if (!Array.isArray(messages)) return [];
	const roles = new Set(["user", "assistant", "tool"]);
	return messages
		.slice(-MAX_HISTORY_MESSAGES)
		.map((message) => {
			if (!message || !roles.has(message.role)) return null;
			if (message.role === "tool") {
				if (typeof message.toolCallId !== "string") return null;
				return {
					role: "tool",
					toolCallId: clip(message.toolCallId, 80),
					content: clip(message.content || "", MAX_MESSAGE_CHARS),
				};
			}
			if (message.role === "assistant" && Array.isArray(message.toolCalls)) {
				return {
					role: "assistant",
					content: clip(message.content || "", MAX_MESSAGE_CHARS),
					toolCalls: sanitizeToolCalls(message.toolCalls),
				};
			}
			const images = message.role === "user" ? sanitizeImages(message.images) : [];
			return {
				role: message.role,
				content: clip(message.content || "", MAX_MESSAGE_CHARS),
				images,
			};
		})
		.filter(Boolean);
}

function toOpenRouterMessage(message, includeImages) {
	if (message.role === "tool") {
		return {
			role: "tool",
			tool_call_id: message.toolCallId,
			content: message.content || "",
		};
	}
	if (message.role === "assistant" && message.toolCalls?.length) {
		return {
			role: "assistant",
			content: message.content || null,
			tool_calls: message.toolCalls.map((call) => ({
				id: call.id,
				type: "function",
				function: {
					name: call.name,
					arguments: JSON.stringify(call.arguments || {}),
				},
			})),
		};
	}
	if (message.role === "user" && includeImages && message.images?.length) {
		return {
			role: "user",
			content: [
				{ type: "text", text: message.content || "" },
				...message.images.map((image) => ({
					type: "image_url",
					image_url: { url: image.dataUrl },
				})),
			],
		};
	}
	const content =
		message.role === "user" && message.images?.length
			? `${message.content || ""}\n(image attached)`
			: message.content || "";
	return { role: message.role, content };
}

function writeEvent(res, event, data) {
	res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export default async function handler(req, res) {
	if (req.method !== "POST") {
		res.setHeader("Allow", "POST");
		res.status(405).json({ error: "Method not allowed." });
		return;
	}

	const body = req.body || {};
	const requested = typeof body.model === "string" ? body.model : "";
	const allowed = new Set(
		[process.env.OPENROUTER_MODEL, "openai/gpt-4o-mini", "anthropic/claude-3.5-haiku", "google/gemini-2.0-flash-001"].filter(Boolean),
	);
	if (requested && !allowed.has(requested)) {
		res.status(400).json({ error: "That model is not available." });
		return;
	}

	const mode = ["ask", "edit", "brainstorm"].includes(body.mode) ? body.mode : "ask";
	const note = sanitizeNote(body.note);
	const selection = sanitizeSelection(body.selection);
	const messages = sanitizeMessages(body.messages);
	const hasUserMessage = messages.some(
		(message) => message.role === "user" && String(message.content || "").trim(),
	);
	if (!hasUserMessage) {
		res.status(400).json({ error: "Write a message first." });
		return;
	}

	if (!process.env.OPENROUTER_API_KEY) {
		res.status(503).json({ error: "OpenRouter API key is not configured." });
		return;
	}

	const model = requested && allowed.has(requested) ? requested : resolveModel("");
	const history = messages.map((message) => {
		const lastUser = [...messages].reverse().find((item) => item.role === "user");
		const includeImages = message.role === "user" && message === lastUser;
		return toOpenRouterMessage(message, includeImages);
	});

	const openRouterMessages = [
		{
			role: "system",
			content: `${buildSystemPrompt(mode)}\n\n${buildDocumentContext(note, selection)}`,
		},
		...history,
	];

	let upstream;
	try {
		upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
				"Content-Type": "application/json",
				"HTTP-Referer": "http://localhost:3000",
				"X-Title": "OpenNote",
			},
			body: JSON.stringify({
				model,
				messages: openRouterMessages,
				tools: LOCAL_TOOLS,
				tool_choice: "auto",
				temperature: 0.4,
				max_tokens: 2000,
				stream: true,
			}),
		});
	} catch (error) {
		console.error("OpenRouter network error:", error?.message || error);
		res.status(502).json({ error: "Could not reach OpenRouter." });
		return;
	}

	if (!upstream.ok || !upstream.body) {
		const bodyText = await upstream.text().catch(() => "");
		const mapped = publicError(upstream.status, friendlyUpstreamError(upstream.status, bodyText));
		res.status(mapped.status >= 400 ? mapped.status : 502).json({ error: mapped.error });
		return;
	}

	res.writeHead(200, {
		"Content-Type": "text/event-stream; charset=utf-8",
		"Cache-Control": "no-cache, no-transform",
		Connection: "keep-alive",
		"X-Accel-Buffering": "no",
	});
	res.flushHeaders?.();

	const reader = upstream.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	let content = "";
	const toolCalls = new Map();
	let closed = false;

	req.on("close", () => {
		closed = true;
		reader.cancel().catch(() => {});
	});

	try {
		while (!closed) {
			const { done, value } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split("\n");
			buffer = lines.pop() || "";
			for (const line of lines) {
				const trimmed = line.trim();
				if (!trimmed.startsWith("data:")) continue;
				const data = trimmed.slice(5).trim();
				if (!data || data === "[DONE]") continue;
				let json;
				try {
					json = JSON.parse(data);
				} catch {
					continue;
				}
				const delta = json.choices?.[0]?.delta;
				if (!delta) continue;
				if (delta.content) {
					content += delta.content;
					writeEvent(res, "delta", { text: delta.content });
				}
				if (Array.isArray(delta.tool_calls)) {
					for (const call of delta.tool_calls) {
						const index = call.index ?? 0;
						const existing = toolCalls.get(index) || {
							id: "",
							name: "",
							arguments: "",
						};
						if (call.id) existing.id = call.id;
						if (call.function?.name) existing.name += call.function.name;
						if (call.function?.arguments) existing.arguments += call.function.arguments;
						toolCalls.set(index, existing);
					}
				}
			}
		}
	} catch (error) {
		if (!closed) {
			console.error("OpenRouter stream error:", error?.message || error);
			writeEvent(res, "error", { message: "The AI response was interrupted." });
		}
	}

	if (!closed && toolCalls.size) {
		const calls = [...toolCalls.values()]
			.filter((call) => LOCAL_TOOL_NAMES.includes(call.name))
			.map((call) => {
				let parsed = {};
				try {
					parsed =
						call.arguments && call.arguments.length < 80000
							? JSON.parse(call.arguments)
							: {};
				} catch {
					parsed = {};
				}
				return {
					id: call.id || `tool-${call.name}`,
					name: call.name,
					arguments: parsed && typeof parsed === "object" ? parsed : {},
				};
			});
		if (calls.length) writeEvent(res, "tool_calls", { toolCalls: calls });
	}

	if (!closed) {
		writeEvent(res, "done", { text: content });
		res.end();
	}
}
