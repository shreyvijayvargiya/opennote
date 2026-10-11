function escapeHtml(value) {
	return String(value || "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

export function extractProposal(content) {
	const source = String(content || "");
	const match = source.match(/```proposal[^\n]*\n([\s\S]*?)```/);
	if (match) return match[1].trim();
	return source.trim();
}

export function formatInline(text) {
	const source = String(text || "");
	const pattern =
		/(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g;
	const parts = [];
	let last = 0;
	let match = pattern.exec(source);
	while (match) {
		if (match.index > last) {
			parts.push({ type: "text", value: source.slice(last, match.index) });
		}
		const token = match[0];
		if (token.startsWith("**")) {
			parts.push({ type: "strong", value: token.slice(2, -2) });
		} else if (token.startsWith("`")) {
			parts.push({ type: "code", value: token.slice(1, -1) });
		} else if (token.startsWith("[")) {
			const link = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/.exec(token);
			parts.push({
				type: "link",
				value: link?.[1] || token,
				href: link?.[2] || "",
			});
		} else {
			parts.push({ type: "em", value: token.slice(1, -1) });
		}
		last = match.index + token.length;
		match = pattern.exec(source);
	}
	if (last < source.length) {
		parts.push({ type: "text", value: source.slice(last) });
	}
	return parts;
}

export function parseMarkdown(source) {
	const lines = String(source || "")
		.replace(/\r\n/g, "\n")
		.split("\n");
	const blocks = [];
	let index = 0;

	while (index < lines.length) {
		const line = lines[index];
		if (!line.trim()) {
			index += 1;
			continue;
		}

		if (line.startsWith("```")) {
			const lang = line.slice(3).trim();
			const buffer = [];
			index += 1;
			while (index < lines.length && !lines[index].startsWith("```")) {
				buffer.push(lines[index]);
				index += 1;
			}
			if (index < lines.length) index += 1;
			blocks.push({
				type: lang === "proposal" ? "proposal" : "code",
				text: buffer.join("\n"),
			});
			continue;
		}

		const heading = /^(#{1,3})\s+(.*)$/.exec(line);
		if (heading) {
			blocks.push({
				type: "heading",
				level: heading[1].length,
				text: heading[2],
			});
			index += 1;
			continue;
		}

		if (/^>\s?/.test(line)) {
			const buffer = [];
			while (index < lines.length && /^>\s?/.test(lines[index])) {
				buffer.push(lines[index].replace(/^>\s?/, ""));
				index += 1;
			}
			blocks.push({ type: "quote", text: buffer.join("\n") });
			continue;
		}

		if (/^\s*[-*]\s+/.test(line)) {
			const items = [];
			while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
				items.push(lines[index].replace(/^\s*[-*]\s+/, ""));
				index += 1;
			}
			blocks.push({ type: "list", ordered: false, items });
			continue;
		}

		if (/^\s*\d+\.\s+/.test(line)) {
			const items = [];
			while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
				items.push(lines[index].replace(/^\s*\d+\.\s+/, ""));
				index += 1;
			}
			blocks.push({ type: "list", ordered: true, items });
			continue;
		}

		const buffer = [line];
		index += 1;
		while (
			index < lines.length &&
			lines[index].trim() &&
			!/^(#{1,3}\s|```|>\s|[-*]\s|\d+\.\s)/.test(lines[index])
		) {
			buffer.push(lines[index]);
			index += 1;
		}
		blocks.push({ type: "paragraph", text: buffer.join(" ") });
	}

	return blocks;
}

function inlineHtml(text) {
	let html = escapeHtml(text);
	html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
	html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
	html = html.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
	html = html.replace(
		/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
		'<a href="$2">$1</a>',
	);
	return html;
}

function blocksToHtml(blocks) {
	return blocks
		.map((block) => {
			if (block.type === "heading") {
				const level = Math.min(block.level || 2, 3);
				return `<h${level}>${inlineHtml(block.text)}</h${level}>`;
			}
			if (block.type === "quote") {
				return `<blockquote><p>${inlineHtml(block.text)}</p></blockquote>`;
			}
			if (block.type === "code") {
				return `<pre><code>${escapeHtml(block.text)}</code></pre>`;
			}
			if (block.type === "proposal") {
				return blocksToHtml(parseMarkdown(block.text));
			}
			if (block.type === "list") {
				const tag = block.ordered ? "ol" : "ul";
				const items = block.items
					.map((item) => `<li><p>${inlineHtml(item)}</p></li>`)
					.join("");
				return `<${tag}>${items}</${tag}>`;
			}
			return `<p>${inlineHtml(block.text)}</p>`;
		})
		.join("");
}

export function markdownToEditorHtml(markdown) {
	const text = extractProposal(markdown);
	if (!text) return "<p></p>";
	const looksLikeHtml = /^<\/?[a-z][\s\S]*>/i.test(text) && !text.includes("```");
	if (looksLikeHtml) return text;
	const html = blocksToHtml(parseMarkdown(text));
	return html || "<p></p>";
}
