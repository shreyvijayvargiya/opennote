import { slimHtml } from "./limits";

export function getCurrentDocumentHTML(editor) {
	if (!editor) return "";
	return slimHtml(editor.getHTML());
}

export function getCurrentDocumentText(editor) {
	if (!editor) return "";
	return editor.getText();
}

export function getSelectionRange(editor) {
	if (!editor) return null;
	const { from, to } = editor.state.selection;
	return { from, to };
}

export function getSelectedText(editor) {
	if (!editor) return "";
	const { from, to } = editor.state.selection;
	if (from === to) return "";
	return editor.state.doc.textBetween(from, to, "\n");
}

export function getEditorContext(editor) {
	if (!editor) {
		return { html: "", text: "", selection: null, nearby: "" };
	}

	const { from, to } = editor.state.selection;
	const text = getCurrentDocumentText(editor);
	const html = getCurrentDocumentHTML(editor);
	const selected = getSelectedText(editor);

	if (!selected) {
		return { html, text, selection: null, nearby: "" };
	}

	const docSize = editor.state.doc.content.size;
	const before = editor.state.doc.textBetween(Math.max(0, from - 400), from, "\n");
	const after = editor.state.doc.textBetween(to, Math.min(docSize, to + 400), "\n");

	return {
		html,
		text,
		nearby: `${before}${selected}${after}`,
		selection: {
			text: selected,
			from,
			to,
		},
	};
}
