/** OpenRouter client (OpenAI-compatible chat completions with streaming + tools). */

export const MODELS = [
	{ id: "anthropic/claude-sonnet-4.5", label: "Claude Sonnet 4.5" },
	{ id: "anthropic/claude-haiku-4.5", label: "Claude Haiku 4.5" },
	{ id: "openai/gpt-4o", label: "GPT-4o" },
	{ id: "openai/gpt-4o-mini", label: "GPT-4o mini" },
	{ id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
	{ id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B" },
	{ id: "deepseek/deepseek-chat", label: "DeepSeek Chat" },
];
export const DEFAULT_MODEL = MODELS[0].id;

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Streams one completion. Resolves with the full text and any tool calls.
 * `onText(fullTextSoFar)` fires for every token chunk.
 */
export const streamCompletion = async ({
	apiKey,
	model,
	messages,
	tools,
	plugins,
	signal,
	onText,
}) => {
	const res = await fetch(ENDPOINT, {
		method: "POST",
		signal,
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
			"HTTP-Referer": window.location.origin,
			"X-Title": "RowTabs",
		},
		body: JSON.stringify({ model, messages, tools, plugins, stream: true }),
	});

	if (!res.ok) {
		let detail = "";
		try {
			detail = (await res.json())?.error?.message || "";
		} catch {}
		throw new Error(detail || `OpenRouter error ${res.status}`);
	}

	const reader = res.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	let content = "";
	const calls = [];

	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split("\n");
		buffer = lines.pop();
		for (const raw of lines) {
			const line = raw.trim();
			if (!line.startsWith("data:")) continue; // skips ": OPENROUTER PROCESSING" keep-alives
			const data = line.slice(5).trim();
			if (data === "[DONE]") continue;
			let json;
			try {
				json = JSON.parse(data);
			} catch {
				continue;
			}
			if (json.error) throw new Error(json.error.message || "Model error");
			const delta = json.choices?.[0]?.delta;
			if (!delta) continue;
			if (delta.content) {
				content += delta.content;
				onText?.(content);
			}
			for (const tc of delta.tool_calls || []) {
				const call = (calls[tc.index ?? 0] ??= { id: "", name: "", arguments: "" });
				if (tc.id) call.id = tc.id;
				if (tc.function?.name) call.name += tc.function.name;
				if (tc.function?.arguments) call.arguments += tc.function.arguments;
			}
		}
	}
	return { content, toolCalls: calls.filter(Boolean) };
};
