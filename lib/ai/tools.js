/**
 * Tools the assistant can call. They run in the browser against the live table editors
 * (falling back to IndexedDB for tables that are not open).
 *
 * - read_table                         : read-only
 * - create_table / add_rows / update_cells / add_column / rename_column /
 *   delete_column / delete_rows / rename_table : applied immediately, the chat shows Keep / Undo
 * - delete_table                       : ALWAYS waits for the user to confirm first
 */
import {
	createNote,
	deleteNote,
	estimateTokens,
	mutateTable,
	opAddColumn,
	opAddRows,
	opDeleteColumn,
	opDeleteRows,
	opRenameColumn,
	opUpdateCells,
	readNote,
} from "../tables/tableOps";
import { COLUMN_TYPES } from "../tables/schema";

export const TOOL_READ_TOKEN_CAP = 6000;
const SNAPSHOT_MAX_CHARS = 2_000_000; // bigger tables can still be edited, just not undone

const TYPES = COLUMN_TYPES.map((t) => t.id);
const fn = (name, description, properties, required = []) => ({
	type: "function",
	function: { name, description, parameters: { type: "object", properties, required } },
});
const rowsSchema = { type: "array", items: { type: "object", description: "Keys are column names, values are plain text/numbers/true/false. Chips: use the label. Dates: YYYY-MM-DD." } };

export const TOOLS = [
	fn("read_table", "Read a table: its columns (with types) and all rows. Rows are numbered from 1. Open tables are read live from the editor.", { id: { type: "string" } }, ["id"]),
	fn(
		"create_table",
		"Create a new table (or folder). Give columns (+ optional rows), OR a template phrase like 'whatsapp leads' to start from the gallery. Pass parent_id to nest it under an existing table/folder.",
		{
			title: { type: "string" },
			columns: { type: "array", items: { type: "object", properties: { name: { type: "string" }, type: { type: "string", enum: TYPES }, options: { type: "array", items: { type: "string" }, description: "Chip labels for type chips" } }, required: ["name"] } },
			rows: rowsSchema,
			template: { type: "string", description: "Gallery search phrase, e.g. 'invoice tracker'" },
			parent_id: { type: "string" },
			is_folder: { type: "boolean" },
		},
		["title"],
	),
	fn("add_rows", "Append rows to a table.", { id: { type: "string" }, rows: rowsSchema }, ["id", "rows"]),
	fn(
		"update_cells",
		"Change cells. row is the 1-based row number from read_table; column is the column name.",
		{ id: { type: "string" }, updates: { type: "array", items: { type: "object", properties: { row: { type: "number" }, column: { type: "string" }, value: {} }, required: ["row", "column", "value"] } } },
		["id", "updates"],
	),
	fn("add_column", "Add a column to the end of a table.", { id: { type: "string" }, name: { type: "string" }, type: { type: "string", enum: TYPES }, options: { type: "array", items: { type: "string" } } }, ["id", "name"]),
	fn("rename_column", "Rename a column.", { id: { type: "string" }, column: { type: "string" }, new_name: { type: "string" } }, ["id", "column", "new_name"]),
	fn("delete_column", "Delete a column and its values.", { id: { type: "string" }, column: { type: "string" } }, ["id", "column"]),
	fn("delete_rows", "Delete rows by their 1-based numbers.", { id: { type: "string" }, rows: { type: "array", items: { type: "number" } } }, ["id", "rows"]),
	fn("rename_table", "Rename a table.", { id: { type: "string" }, title: { type: "string" } }, ["id", "title"]),
	fn("delete_table", "Delete a table and all tables nested inside it. The user is asked to confirm first.", { id: { type: "string" } }, ["id"]),
];

const asId = (v) => {
	const n = Number(v);
	return Number.isNaN(n) ? v : n;
};

const descendantCount = (notes, id) => notes.filter((n) => n.parentId === id).reduce((sum, k) => sum + 1 + descendantCount(notes, k.id), 0);

/**
 * Executes a tool call. Returns { result, activity, change? }
 *  - result   : string handed back to the model
 *  - activity : short human line shown in the chat
 *  - change   : reviewable record (Keep / Undo) shown in the chat
 */
export const executeTool = async (name, args, { notes, confirmDelete }) => {
	const id = args.id != null ? asId(args.id) : null;
	const known = id != null ? notes.find((n) => n.id === id) : null;
	const map = new Map(notes.map((n) => [n.id, n]));

	if (name === "read_table") {
		const t = await readNote(id);
		if (!t) return { result: `Error: table ${args.id} not found.` };
		let text = t.markdown;
		if (estimateTokens(text) > TOOL_READ_TOKEN_CAP) text = text.slice(0, TOOL_READ_TOKEN_CAP * 4) + "\n[…trimmed, more rows exist]";
		return { result: `# ${t.title} (id ${t.id}${t.live ? ", live editor" : ""}, ${t.table.rows.length} rows)\n\n${text}`, activity: `Read “${t.title}”` };
	}

	if (name === "create_table") {
		const parentId = args.parent_id != null ? asId(args.parent_id) : null;
		if (parentId != null && !map.has(parentId)) return { result: `Error: parent ${args.parent_id} not found.` };
		const rec = await createNote({ title: args.title, columns: args.columns, rows: args.rows, template: args.template, parentId, isFolder: args.is_folder });
		return {
			result: `Created ${args.is_folder ? "folder" : "table"} “${rec.title}” with id ${rec.id}.`,
			change: { kind: "create", noteId: rec.id, title: rec.title, summary: args.is_folder ? "Created folder" : "Created table", status: "pending" },
		};
	}

	if (name === "delete_table") {
		if (!known) return { result: `Error: table ${args.id} not found.` };
		const nested = descendantCount(notes, id);
		const ok = await confirmDelete({ title: known.title || "Untitled", nested });
		if (!ok) return { result: "The user declined the deletion. Do not retry unless asked.", change: { kind: "delete", noteId: id, title: known.title, status: "declined" } };
		await deleteNote(id);
		return { result: `Deleted “${known.title}”${nested ? ` and ${nested} nested table(s)` : ""}.`, change: { kind: "delete", noteId: id, title: known.title, status: "done" } };
	}

	// everything below edits an existing table
	const plans = {
		add_rows: () => [opAddRows(args.rows || [], map), `Added ${(args.rows || []).length} row(s)`],
		update_cells: () => [opUpdateCells(args.updates || [], map), `Updated ${(args.updates || []).length} cell(s)`],
		add_column: () => [opAddColumn(args.name, args.type, args.options), `Added column “${args.name}”`],
		rename_column: () => [opRenameColumn(args.column, args.new_name), `Renamed column “${args.column}”`],
		delete_column: () => [opDeleteColumn(args.column), `Deleted column “${args.column}”`],
		delete_rows: () => [opDeleteRows(args.rows || []), `Deleted ${(args.rows || []).length} row(s)`],
		rename_table: () => [(t) => t, "Renamed table"],
	};
	if (!plans[name]) return { result: `Error: unknown tool ${name}.` };
	if (!(await readNote(id))) return { result: `Error: table ${args.id} not found.` };
	if (name === "rename_table" && !args.title) return { result: "Error: title is required." };

	const [op, summary] = plans[name]();
	const before = await mutateTable(id, op, name === "rename_table" ? { title: args.title } : {});
	const undoable = (before.json || "").length <= SNAPSHOT_MAX_CHARS;
	return {
		result: `${summary} in table ${id}. The user can Keep or Undo the change.`,
		change: { kind: "update", noteId: id, title: args.title ?? before.title, summary, before: undoable ? before : null, status: "pending" },
	};
};
