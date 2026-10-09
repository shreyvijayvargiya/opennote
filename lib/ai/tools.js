/**
 * Tools the assistant can call. They run in the browser against the live
 * Tiptap editors (falling back to IndexedDB for notes that are not open).
 *
 * - read_note   : read-only
 * - create_note / update_note : applied immediately, the chat shows Keep / Undo
 * - delete_note : ALWAYS waits for the user to confirm first
 */
import {
	readNote,
	updateNote,
	createNote,
	deleteNote,
	estimateTokens,
} from "./noteOps";

export const TOOL_READ_TOKEN_CAP = 6000;
const SNAPSHOT_MAX_CHARS = 200_000; // bigger notes can still be edited, just not undone

export const TOOLS = [
	{
		type: "function",
		function: {
			name: "read_note",
			description:
				"Read the current Markdown of a note by id. Open notes are read live from the editor.",
			parameters: {
				type: "object",
				properties: { id: { type: "string" } },
				required: ["id"],
			},
		},
	},
	{
		type: "function",
		function: {
			name: "create_note",
			description:
				"Create a new note (or folder). Pass parent_id to nest it under an existing note/folder.",
			parameters: {
				type: "object",
				properties: {
					title: { type: "string" },
					content: { type: "string", description: "Markdown body" },
					parent_id: { type: "string", description: "Optional parent note id" },
					is_folder: { type: "boolean" },
				},
				required: ["title"],
			},
		},
	},
	{
		type: "function",
		function: {
			name: "update_note",
			description:
				'Change a note. mode "append" adds Markdown to the end (preferred for additions); "replace" overwrites the whole body, so read_note first and send the complete new Markdown.',
			parameters: {
				type: "object",
				properties: {
					id: { type: "string" },
					title: { type: "string" },
					content: { type: "string", description: "Markdown" },
					mode: { type: "string", enum: ["append", "replace"] },
				},
				required: ["id"],
			},
		},
	},
	{
		type: "function",
		function: {
			name: "delete_note",
			description:
				"Delete a note and all its nested pages. The user is asked to confirm first.",
			parameters: {
				type: "object",
				properties: { id: { type: "string" } },
				required: ["id"],
			},
		},
	},
];

const asId = (v) => {
	const n = Number(v);
	return Number.isNaN(n) ? v : n;
};

const descendantCount = (notes, id) => {
	const kids = notes.filter((n) => n.parentId === id);
	return kids.reduce((sum, k) => sum + 1 + descendantCount(notes, k.id), 0);
};

/**
 * Executes a tool call. Returns { result, activity, change? }
 *  - result   : string handed back to the model
 *  - activity : short human line shown in the chat
 *  - change   : reviewable record (Keep / Undo) shown in the chat
 */
export const executeTool = async (name, args, { notes, confirmDelete }) => {
	const id = args.id != null ? asId(args.id) : null;
	const known = id != null ? notes.find((n) => n.id === id) : null;

	if (name === "read_note") {
		const note = await readNote(id);
		if (!note) return { result: `Error: note ${args.id} not found.` };
		let text = note.markdown;
		if (estimateTokens(text) > TOOL_READ_TOKEN_CAP) {
			text = text.slice(0, TOOL_READ_TOKEN_CAP * 4) + "\n[…trimmed]";
		}
		return {
			result: `# ${note.title} (id ${note.id}${note.live ? ", live editor" : ""})\n\n${text}`,
			activity: `Read “${note.title}”`,
		};
	}

	if (name === "create_note") {
		const parentId = args.parent_id != null ? asId(args.parent_id) : null;
		if (parentId != null && !notes.some((n) => n.id === parentId)) {
			return { result: `Error: parent ${args.parent_id} not found.` };
		}
		const note = await createNote({
			title: args.title,
			content: args.content,
			parentId,
			isFolder: args.is_folder,
		});
		return {
			result: `Created ${args.is_folder ? "folder" : "note"} “${note.title}” with id ${note.id}.`,
			change: {
				kind: "create",
				noteId: note.id,
				title: note.title,
				summary: args.is_folder ? "Created folder" : "Created note",
				status: "pending",
			},
		};
	}

	if (name === "update_note") {
		if (!known && !(await readNote(id))) {
			return { result: `Error: note ${args.id} not found.` };
		}
		if (args.content == null && args.title == null) {
			return { result: "Error: nothing to update (send content and/or title)." };
		}
		const mode = args.mode === "append" ? "append" : "replace";
		const before = await updateNote(id, {
			title: args.title,
			content: args.content,
			mode,
		});
		const undoable = (before.html || "").length <= SNAPSHOT_MAX_CHARS;
		return {
			result: `Updated note ${id} (${mode}). The user can Keep or Undo the change.`,
			change: {
				kind: "update",
				noteId: id,
				title: args.title ?? before.title,
				summary: mode === "append" ? "Appended to note" : "Rewrote note",
				before: undoable ? before : null,
				status: "pending",
			},
		};
	}

	if (name === "delete_note") {
		if (!known) return { result: `Error: note ${args.id} not found.` };
		const nested = descendantCount(notes, id);
		const ok = await confirmDelete({ title: known.title || "Untitled", nested });
		if (!ok) {
			return {
				result: "The user declined the deletion. Do not retry unless asked.",
				change: { kind: "delete", noteId: id, title: known.title, status: "declined" },
			};
		}
		await deleteNote(id);
		return {
			result: `Deleted “${known.title}”${nested ? ` and ${nested} nested page(s)` : ""}.`,
			change: { kind: "delete", noteId: id, title: known.title, status: "done" },
		};
	}

	return { result: `Error: unknown tool ${name}.` };
};
