export async function streamAIChat(body, { onDelta, signal } = {}) {
	const response = await fetch("/api/ai/chat", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
		signal,
	});

	const type = response.headers.get("content-type") || "";
	if (!response.ok || type.includes("application/json")) {
		let message = "The AI request failed.";
		try {
			const data = await response.json();
			if (data?.error) message = data.error;
		} catch {
			message = "The AI request failed.";
		}
		throw new Error(message);
	}

	if (!response.body) {
		throw new Error("The AI request failed.");
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	let text = "";
	const toolCalls = [];

	while (true) {
		if (signal?.aborted) {
			await reader.cancel();
			const error = new Error("Stopped");
			error.name = "AbortError";
			throw error;
		}
		const { done, value } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });
		const chunks = buffer.split("\n\n");
		buffer = chunks.pop() || "";
		for (const chunk of chunks) {
			let eventName = "message";
			const dataLines = [];
			for (const line of chunk.split("\n")) {
				if (line.startsWith("event:")) eventName = line.slice(6).trim();
				if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
			}
			if (!dataLines.length) continue;
			let payload = {};
			try {
				payload = JSON.parse(dataLines.join(""));
			} catch {
				continue;
			}
			if (eventName === "delta" && payload.text) {
				text += payload.text;
				onDelta?.(text);
			}
			if (eventName === "tool_calls" && Array.isArray(payload.toolCalls)) {
				toolCalls.push(...payload.toolCalls);
			}
			if (eventName === "error") {
				throw new Error(payload.message || "The AI request failed.");
			}
		}
	}

	return { text, toolCalls };
}
