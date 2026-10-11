/** Export the current chat as Markdown or a standalone HTML page. */
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const when = (ts) => new Date(ts).toLocaleString();
const who = (m) => (m.role === "user" ? "You" : "Assistant");
const note = (m) => (m.attachments?.length ? `\n\n_Attached: ${m.attachments.map((a) => a.name).join(", ")}_` : "");

export const chatToMarkdown = (messages) =>
	messages
		.map((m) => `### ${who(m)} · ${when(m.createdAt)}\n\n${m.content || ""}${note(m)}`)
		.join("\n\n---\n\n") + "\n";

export const chatToHtml = (messages) =>
	`<!doctype html><html><head><meta charset="utf-8"><title>OpenNote chat</title><style>body{max-width:720px;margin:40px auto;padding:0 16px;font:15px/1.6 system-ui,sans-serif;color:#18181b}.m{margin:0 0 20px}.h{font-size:12px;color:#71717a;margin-bottom:4px}.u .b{background:#f4f4f5;border-radius:12px;padding:8px 12px;display:inline-block}.b{white-space:pre-wrap}</style></head><body>${messages
		.map(
			(m) =>
				`<div class="m ${m.role === "user" ? "u" : ""}"><div class="h">${who(m)} · ${when(m.createdAt)}</div><div class="b">${esc(m.content || "")}</div>${m.attachments?.length ? `<div class="h">Attached: ${esc(m.attachments.map((a) => a.name).join(", "))}</div>` : ""}</div>`,
		)
		.join("")}</body></html>`;

export const downloadText = (filename, mime, text) => {
	const url = URL.createObjectURL(new Blob([text], { type: mime }));
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
};
