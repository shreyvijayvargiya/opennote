/**
 * Convert HTML to Markdown
 * Custom implementation without external packages
 * @param {string} html - HTML string to convert
 * @returns {string} Markdown string
 */
export const htmlToMarkdown = (html) => {
	if (!html) return "";

	// Create a temporary DOM element to parse HTML
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, "text/html");
	const body = doc.body;

	// Helper function to process a node
	const processNode = (node) => {
		if (node.nodeType === Node.TEXT_NODE) {
			return node.textContent || "";
		}

		if (node.nodeType !== Node.ELEMENT_NODE) {
			return "";
		}

		const tagName = node.tagName.toLowerCase();
		const children = Array.from(node.childNodes)
			.map(processNode)
			.join("")
			.trim();

		switch (tagName) {
			case "h1":
				return `# ${children}\n\n`;
			case "h2":
				return `## ${children}\n\n`;
			case "h3":
				return `### ${children}\n\n`;
			case "h4":
				return `#### ${children}\n\n`;
			case "h5":
				return `##### ${children}\n\n`;
			case "h6":
				return `###### ${children}\n\n`;
			case "p":
				return `${children}\n\n`;
			case "br":
				return "\n";
			case "strong":
			case "b":
				return `**${children}**`;
			case "em":
			case "i":
				return `*${children}*`;
			case "code":
				return `\`${children}\``;
			case "pre":
				return `\`\`\`\n${children}\n\`\`\`\n\n`;
			case "a":
				const href = node.getAttribute("href") || "";
				return href ? `[${children}](${href})` : children;
			case "img":
				const src = node.getAttribute("src") || "";
				const alt = node.getAttribute("alt") || "";
				return src ? `![${alt}](${src})` : "";
			case "ul":
				const ulItems = Array.from(node.querySelectorAll(":scope > li"))
					.map((li) => {
						const liContent = Array.from(li.childNodes)
							.map(processNode)
							.join("")
							.trim();
						return `- ${liContent}`;
					})
					.join("\n");
				return `${ulItems}\n\n`;
			case "ol":
				const olItems = Array.from(node.querySelectorAll(":scope > li"))
					.map((li, index) => {
						const liContent = Array.from(li.childNodes)
							.map(processNode)
							.join("")
							.trim();
						return `${index + 1}. ${liContent}`;
					})
					.join("\n");
				return `${olItems}\n\n`;
			case "li":
				// Handle nested lists
				const liChildren = Array.from(node.childNodes)
					.map(processNode)
					.join("")
					.trim();
				return liChildren;
			case "blockquote":
				const lines = children.split("\n").filter((line) => line.trim());
				return lines.map((line) => `> ${line}`).join("\n") + "\n\n";
			case "hr":
				return "---\n\n";
			case "div":
			case "span":
				return children;
			default:
				return children;
		}
	};

	// Process all child nodes
	const markdown = Array.from(body.childNodes)
		.map(processNode)
		.join("")
		.trim();

	// Clean up multiple newlines
	return markdown.replace(/\n{3,}/g, "\n\n");
};

