import { noteService } from "../db/noteService";
import { createNote, mutateTable, opAddRows, readNote } from "../tables/tableOps";
import { parseTable } from "../tables/schema";

const text = (value) => ({ content: [{ type: "text", text: typeof value === "string" ? value : JSON.stringify(value) }] });

/** Tools registered with WebMCP so agents can use the tables of the open tab. */
export const getTablesTools = (user) => {
	const uid = user?.uid || "local-user";

	return [
		{
			name: "list_tables",
			description: "List all tables and folders in RowTabs",
			schema: { type: "object", properties: {} },
			execute: async () => {
				const all = await noteService.getAllNotes(uid);
				return text(all.map((n) => ({ id: n.id, title: n.title, parentId: n.parentId ?? null, folder: Boolean(n.isFolder), rows: n.isFolder ? 0 : parseTable(n.content).rows.length })));
			},
		},
		{
			name: "get_table",
			description: "Get a table as a Markdown grid with 1-based row numbers",
			schema: { type: "object", properties: { id: { type: "string", description: "Table id" } }, required: ["id"] },
			execute: async ({ id }) => {
				const t = await readNote(id);
				return text(t ? `# ${t.title}\n\n${t.markdown}` : { error: "Table not found" });
			},
		},
		{
			name: "create_table",
			description: "Create a table from columns (name + type) and optional rows",
			schema: {
				type: "object",
				properties: {
					title: { type: "string" },
					columns: { type: "array", items: { type: "object", properties: { name: { type: "string" }, type: { type: "string" } }, required: ["name"] } },
					rows: { type: "array", items: { type: "object" }, description: "Objects keyed by column name" },
				},
				required: ["title", "columns"],
			},
			execute: async ({ title, columns, rows }) => {
				const rec = await createNote({ title, columns, rows });
				return text({ id: rec.id, title: rec.title });
			},
		},
		{
			name: "add_rows",
			description: "Append rows (objects keyed by column name) to a table",
			schema: { type: "object", properties: { id: { type: "string" }, rows: { type: "array", items: { type: "object" } } }, required: ["id", "rows"] },
			execute: async ({ id, rows }) => {
				const map = new Map((await noteService.getAllNotes(uid)).map((n) => [n.id, n]));
				await mutateTable(id, opAddRows(rows, map));
				return text({ ok: true, added: rows.length });
			},
		},
	];
};
