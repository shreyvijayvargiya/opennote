import { noteService } from "../db/noteService";
import { clip, MAX_DOCUMENT_CHARS } from "./limits";
import { LOCAL_TOOL_NAMES } from "./tools";
import {
	insertAt,
	replaceDocument,
	replaceSelection,
} from "./editorActions";
import { markdownToEditorHtml } from "./markdown";

const USER_ID = "local-user";

function sameId(left, right) {
	if (left == null || right == null) return false;
	return String(left) === String(right);
}

function plainText(html) {
	return String(html || "")
		.replace(/<[^>]*>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function toStoredHtml(content) {
	const value = clip(content, MAX_DOCUMENT_CHARS);
	if (!value.trim()) return "<p></p>";
	if (/^<\/?[a-z][\s\S]*>/i.test(value.trim())) return value;
	return markdownToEditorHtml(value);
}

async function listNotes(query) {
	const notes = await noteService.getAllNotes(USER_ID);
	const needle = String(query || "").trim().toLowerCase();
	const matches = notes
		.filter((note) => !needle || (note.title || "").toLowerCase().includes(needle))
		.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
		.slice(0, 40)
		.map((note) => ({
			id: note.id,
			title: note.title || "Untitled",
			parentId: note.parentId ?? null,
			updatedAt: note.updatedAt || null,
		}));
	return {
		ok: true,
		summary: `Found ${matches.length} note${matches.length === 1 ? "" : "s"}.`,
		notes: matches,
	};
}

async function readNote(id) {
	const note = await noteService.getNote(id);
	if (!note) return { ok: false, error: "Note not found." };
	return {
		ok: true,
		summary: `Read “${note.title || "Untitled"}”.`,
		note: {
			id: note.id,
			title: note.title || "Untitled",
			parentId: note.parentId ?? null,
			text: clip(plainText(note.content), 8000),
		},
	};
}

export async function executeLocalTool(call, context) {
	const name = call?.name;
	const args = call?.arguments && typeof call.arguments === "object" ? call.arguments : {};
	if (!LOCAL_TOOL_NAMES.includes(name)) {
		return { ok: false, error: "That action is not available." };
	}

	try {
		if (name === "list_notes") return listNotes(args.query);
		if (name === "get_note") return readNote(args.id);

		if (name === "create_note") {
			const title = clip(args.title || "Untitled Note", 200);
			const saved = await noteService.saveNote(USER_ID, {
				title,
				content: toStoredHtml(args.content || ""),
				parentId: args.parentId,
			});
			return {
				ok: true,
				summary: `Created “${saved.title || title}”.`,
				note: { id: saved.id, title: saved.title },
			};
		}

		if (name === "delete_note") {
			const note = await noteService.getNote(args.id);
			if (!note) return { ok: false, error: "Note not found." };
			const confirmed = await context.confirm({
				title: `Delete “${note.title || "Untitled"}”?`,
				body: "This removes the note and any nested pages.",
				confirmLabel: "Delete",
			});
			if (!confirmed) {
				return { ok: false, cancelled: true, error: "The writer cancelled this change." };
			}
			await noteService.deleteNote(note.id);
			if (sameId(context.activeNoteId, note.id)) context.onActiveDeleted?.();
			return { ok: true, summary: `Deleted “${note.title || "Untitled"}”.` };
		}

		if (name === "update_note") {
			const targetId = args.id ?? context.activeNoteId;
			const note = await noteService.getNote(targetId);
			if (!note) return { ok: false, error: "Note not found." };
			const nextTitle = args.title != null ? clip(args.title, 200) : note.title;
			const replacingContent = args.content != null && String(args.content).trim() !== "";
			const isActive = sameId(note.id, context.activeNoteId);
			if (replacingContent) {
				const confirmed = await context.confirm({
					title: isActive
						? "Replace the current document with this version?"
						: `Replace “${note.title || "Untitled"}” with this version?`,
					body: "You can undo this in the editor if it is the open note.",
					confirmLabel: "Replace",
				});
				if (!confirmed) {
					return {
						ok: false,
						cancelled: true,
						error: "The writer cancelled this change.",
					};
				}
			}
			if (isActive && context.editor) {
				if (args.title != null) context.setTitle?.(nextTitle);
				if (replacingContent) replaceDocument(context.editor, args.content);
				await context.saveNow?.();
			} else {
				await noteService.saveNote(USER_ID, {
					id: note.id,
					title: nextTitle,
					content: replacingContent ? toStoredHtml(args.content) : note.content,
					parentId: note.parentId,
				});
			}
			return {
				ok: true,
				summary: replacingContent
					? `Updated “${nextTitle || "Untitled"}”.`
					: `Renamed the note to “${nextTitle}”.`,
			};
		}

		if (name === "insert_content") {
			const content = clip(args.content, MAX_DOCUMENT_CHARS);
			if (!content.trim()) return { ok: false, error: "Nothing to insert." };
			const targetId = args.id ?? context.activeNoteId;
			const isActive = sameId(targetId, context.activeNoteId) || targetId == null;
			if (isActive && context.editor) {
				insertAt(context.editor, content, args.where || "cursor");
				await context.saveNow?.();
				return { ok: true, summary: "Inserted content into the open note." };
			}
			const note = await noteService.getNote(targetId);
			if (!note) return { ok: false, error: "Note not found." };
			const html = toStoredHtml(content);
			const next =
				args.where === "start" ? `${html}${note.content || ""}` : `${note.content || ""}${html}`;
			await noteService.saveNote(USER_ID, {
				id: note.id,
				title: note.title,
				content: next,
				parentId: note.parentId,
			});
			return { ok: true, summary: `Inserted content into “${note.title || "Untitled"}”.` };
		}

		if (name === "replace_selection") {
			const content = clip(args.content, MAX_DOCUMENT_CHARS);
			if (!context.editor) return { ok: false, error: "No note is open." };
			const replaced = replaceSelection(context.editor, content);
			if (!replaced) return { ok: false, error: "Nothing is selected." };
			await context.saveNow?.();
			return { ok: true, summary: "Replaced the selected text." };
		}

		return { ok: false, error: "That action is not available." };
	} catch (error) {
		console.error("Local tool failed:", error);
		return { ok: false, error: "The note could not be changed." };
	}
}
