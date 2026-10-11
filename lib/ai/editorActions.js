import { extractProposal, markdownToEditorHtml } from "./markdown";

export function insertAtCursor(editor, text) {
	if (!editor) return false;
	const html = markdownToEditorHtml(text);
	editor.chain().focus().insertContent(html).run();
	return true;
}

export function replaceSelection(editor, text) {
	if (!editor) return false;
	const { from, to } = editor.state.selection;
	if (from === to) return false;
	const html = markdownToEditorHtml(text);
	editor.chain().focus().deleteSelection().insertContent(html).run();
	return true;
}

export function replaceDocument(editor, text) {
	if (!editor) return false;
	const html = markdownToEditorHtml(text);
	editor.chain().focus().setContent(html).run();
	return true;
}

export function insertAt(editor, text, where) {
	if (!editor) return false;
	const html = markdownToEditorHtml(text);
	if (where === "start") {
		editor.chain().focus("start").insertContent(html).run();
		return true;
	}
	if (where === "end") {
		editor.chain().focus("end").insertContent(html).run();
		return true;
	}
	editor.chain().focus().insertContent(html).run();
	return true;
}

export async function copyText(text) {
	const value = extractProposal(text);
	if (!value) return false;
	await navigator.clipboard.writeText(value);
	return true;
}
