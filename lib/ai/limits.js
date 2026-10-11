export const MAX_DOCUMENT_CHARS = 50000;
export const MAX_MESSAGE_CHARS = 10000;
export const MAX_SELECTION_CHARS = 20000;
export const MAX_NEARBY_CHARS = 2000;
export const MAX_HISTORY_MESSAGES = 20;
export const MAX_IMAGES = 3;
export const MAX_IMAGE_BYTES = 800 * 1024;
export const MAX_TOOL_ROUNDS = 4;

export function clip(value, max) {
	const text = value == null ? "" : String(value);
	if (text.length <= max) return text;
	return `${text.slice(0, max)}\n[truncated]`;
}

export function slimHtml(html) {
	return String(html || "")
		.replace(/\ssrc=(["'])data:[^"']*\1/gi, ' src="[embedded-image]"')
		.replace(/data:image\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=]+/g, "[embedded-image]");
}
