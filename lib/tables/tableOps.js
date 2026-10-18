/**
 * Table operations used by the AI assistant (and the MCP tools).
 *
 * Source of truth rule: if a table is open in an editor we read/write the LIVE editor state
 * (what the user sees, including unsaved typing). Only tables that are not open use IndexedDB.
 */
import { noteService } from "../db/noteService";
import { buildTableFromTemplate, searchTemplates } from "./gallery";
import { cellText, emptyTable, makeColumn, makeOption, makeRow, parseTable, serializeTable, typeOf, COLUMN_TYPES, LIMITS, uid } from "./schema";

const USER_ID = "local-user";

/* ---------------- live editor registry (TableEditor registers itself) ---------------- */
const live = new Map(); // String(id) -> { get(): {title, table}, apply(fn, title?), save() }
export const registerEditor = (id, api) => live.set(String(id), api);
export const unregisterEditor = (id, api) => {
	if (live.get(String(id)) === api) live.delete(String(id));
};
export const getLiveEditor = (id) => live.get(String(id));

export const estimateTokens = (text) => Math.ceil((text || "").length / 4);

const tablesMap = async () => new Map((await noteService.getAllNotes(USER_ID)).map((n) => [n.id, n]));

/* ---------------- read ---------------- */
/** { id, title, table, json, markdown, live } or null. `json` is the exact stored state (for undo). */
export const readNote = async (id) => {
	const l = getLiveEditor(id);
	const map = await tablesMap();
	if (l) {
		const { title, table } = l.get();
		return { id: String(id), title, table, json: serializeTable(table), markdown: aiMarkdown(table, map), live: true };
	}
	const rec = await noteService.getNote(id);
	if (!rec) return null;
	const table = parseTable(rec.content);
	return { id: String(rec.id), title: rec.title || "Untitled", table, json: serializeTable(table), markdown: aiMarkdown(table, map), live: false };
};

/** Markdown with a 1-based row number so the model can address rows; images/files are masked. */
const aiMarkdown = (table, map) => {
	if (!table.columns.length) return "(empty table, no columns)";
	const head = `| # | ${table.columns.map((c) => `${c.name} {${c.type}}`).join(" | ")} |`;
	const sep = `| --- | ${table.columns.map(() => "---").join(" | ")} |`;
	const body = table.rows.map((r, i) => `| ${i + 1} | ${table.columns.map((c) => aiCell(c, r.cells[c.id], map)).join(" | ")} |`);
	return [head, sep, ...body].join("\n");
};
const aiCell = (c, v, map) => {
	if (c.type === "image") return v ? "(image)" : "";
	if (c.type === "table") return v != null ? `[${map.get(v)?.title || "table"}](page://${v})` : "";
	return cellText(c, v, map).replace(/\|/g, "\\|").replace(/\n/g, " ");
};

/* ---------------- write ---------------- */
/** Applies fn(table) -> table. Returns the snapshot taken BEFORE the change. */
export const mutateTable = async (id, fn, { title } = {}) => {
	const before = await readNote(id);
	if (!before) throw new Error(`Table ${id} not found`);
	const l = getLiveEditor(id);
	if (l) {
		l.apply(fn, title);
		await l.save();
	} else {
		const rec = await noteService.getNote(id);
		const next = fn(parseTable(rec.content));
		await noteService.saveNote(USER_ID, { ...rec, title: title ?? rec.title, content: serializeTable(next) });
	}
	return { title: before.title, json: before.json };
};

/** Restore a pre-change snapshot. */
export const restoreNote = async (id, snapshot) => {
	const table = parseTable(snapshot.json);
	const l = getLiveEditor(id);
	if (l) {
		l.apply(() => table, snapshot.title);
		await l.save();
		return;
	}
	const rec = await noteService.getNote(id);
	if (!rec) return;
	await noteService.saveNote(USER_ID, { ...rec, title: snapshot.title, content: serializeTable(table) });
};

export const deleteNote = (id) => noteService.deleteNote(id);

/* ---------------- value coercion (model sends plain JSON, we store typed cells) ---------------- */
const norm = (s) => String(s ?? "").trim().toLowerCase();
export const findColumn = (table, ref) => table.columns.find((c) => c.id === ref) || table.columns.find((c) => norm(c.name) === norm(ref));

export const coerce = (col, value, map) => {
	if (value === null || value === undefined || value === "") return undefined;
	switch (col.type) {
		case "number": {
			const n = Number(String(value).replace(/[^\d.-]/g, ""));
			return Number.isNaN(n) ? undefined : n;
		}
		case "slider":
			return Math.max(0, Math.min(100, Number(value) || 0));
		case "rating":
			return Math.max(1, Math.min(5, Math.round(Number(value) || 0))) || undefined;
		case "checkbox":
			return value === true || /^(true|yes|y|1|done|checked)$/i.test(String(value)) ? true : undefined;
		case "date": {
			const d = new Date(value);
			return Number.isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
		}
		case "chips": {
			const label = String(value).trim();
			col.options = col.options || [];
			let opt = col.options.find((o) => norm(o.label) === norm(label) || o.id === value);
			if (!opt) {
				opt = makeOption(label, col.options.length);
				col.options.push(opt);
			}
			return opt.id;
		}
		case "table": {
			if (map) for (const [id, t] of map) if (id === value || norm(t.title) === norm(value)) return id;
			return undefined;
		}
		case "files":
		case "image":
			return undefined; // binary data can't be written by the model
		case "otp":
			return String(value).replace(/\D/g, "").slice(0, 6) || undefined;
		default:
			return String(value);
	}
};

const buildRow = (table, obj, map) => {
	const cells = {};
	for (const [k, v] of Object.entries(obj || {})) {
		const col = findColumn(table, k);
		if (!col) continue;
		const val = coerce(col, v, map);
		if (val !== undefined) cells[col.id] = val;
	}
	return makeRow(cells);
};

/* ---------------- operations used by the tools ---------------- */
export const opAddRows = (rows, map) => (table) => {
	const cols = table.columns.map((c) => ({ ...c, options: c.options ? [...c.options] : undefined }));
	const t = { ...table, columns: cols };
	const room = Math.max(0, LIMITS.ROWS - t.rows.length);
	const add = rows.slice(0, room).map((r) => buildRow(t, r, map));
	return { ...t, rows: [...t.rows, ...add] };
};

export const opUpdateCells = (updates, map) => (table) => {
	const cols = table.columns.map((c) => ({ ...c, options: c.options ? [...c.options] : undefined }));
	const t = { ...table, columns: cols, rows: table.rows.map((r) => ({ ...r, cells: { ...r.cells } })) };
	for (const u of updates) {
		const row = t.rows[Number(u.row) - 1];
		const col = findColumn(t, u.column);
		if (!row || !col) continue;
		const val = coerce(col, u.value, map);
		if (val === undefined) delete row.cells[col.id];
		else row.cells[col.id] = val;
	}
	return t;
};

export const opAddColumn = (name, type, options) => (table) => {
	if (table.columns.length >= LIMITS.COLUMNS) return table;
	const t = COLUMN_TYPES.some((x) => x.id === type) ? type : "text";
	const col = makeColumn(name, t, t === "chips" && options?.length ? { options: options.map((l, i) => makeOption(l, i)) } : {});
	return { ...table, columns: [...table.columns, col] };
};

export const opDeleteRows = (indices) => (table) => {
	const drop = new Set(indices.map((n) => Number(n) - 1));
	return { ...table, rows: table.rows.filter((_, i) => !drop.has(i)) };
};

export const opDeleteColumn = (ref) => (table) => {
	const col = findColumn(table, ref);
	if (!col) return table;
	return {
		...table,
		columns: table.columns.filter((c) => c.id !== col.id),
		rows: table.rows.map((r) => {
			const cells = { ...r.cells };
			delete cells[col.id];
			return { ...r, cells };
		}),
	};
};

export const opRenameColumn = (ref, name) => (table) => {
	const col = findColumn(table, ref);
	return col ? { ...table, columns: table.columns.map((c) => (c.id === col.id ? { ...c, name } : c)) } : table;
};

/* ---------------- create ---------------- */
export const createNote = async ({ title, columns, rows, parentId, isFolder, template }) => {
	let table = emptyTable();
	if (isFolder) table = { v: 1, columns: [], rows: [] };
	else if (template) {
		const tpl = searchTemplates(template)[0];
		if (tpl) {
			table = buildTableFromTemplate(tpl);
			title = title || tpl.name;
		}
	} else if (columns?.length) {
		const cols = columns.map((c) => {
			const spec = typeof c === "string" ? { name: c } : c;
			const type = COLUMN_TYPES.some((x) => x.id === spec.type) ? spec.type : "text";
			return makeColumn(spec.name || "Column", type, type === "chips" && spec.options?.length ? { options: spec.options.map((l, i) => makeOption(l, i)) } : {});
		});
		table = { v: 1, columns: cols, rows: [] };
		const map = await tablesMap();
		table = opAddRows((rows || []).slice(0, LIMITS.ROWS), map)(table);
		if (!rows?.length) table.rows = [makeRow(), makeRow(), makeRow()];
	}
	return noteService.saveNote(USER_ID, {
		title: title || "Untitled table",
		content: serializeTable(table),
		parentId: parentId ?? undefined,
		isFolder: Boolean(isFolder),
	});
};

/* ---------------- workspace structure + tagged context ---------------- */
export const buildOutline = (notes, { activeId, openIds = [] } = {}, maxLines = 150) => {
	const ids = new Set(notes.map((n) => n.id));
	const kids = new Map();
	for (const n of notes) {
		const parent = n.parentId != null && ids.has(n.parentId) ? n.parentId : null;
		if (!kids.has(parent)) kids.set(parent, []);
		kids.get(parent).push(n);
	}
	const lines = [];
	const walk = (parent, depth) => {
		for (const n of (kids.get(parent) || []).sort((a, b) => a.id - b.id)) {
			if (lines.length >= maxLines) return;
			const t = n.isFolder ? null : parseTable(n.content);
			const kind = n.isFolder ? "folder" : `table, ${t.columns.length} cols x ${t.rows.length} rows`;
			const tags = [n.id === activeId ? "ACTIVE" : null, openIds.includes(n.id) ? "open" : null].filter(Boolean);
			lines.push(`${"  ".repeat(depth)}- [${n.id}] ${n.title || "Untitled"} (${kind}${tags.length ? ", " + tags.join(", ") : ""})`);
			walk(n.id, depth + 1);
		}
	};
	walk(null, 0);
	if (lines.length >= maxLines) lines.push("- … (tree truncated)");
	return lines.join("\n") || "(no tables yet)";
};

/** Tagged tables + selections, capped at `maxTokens` IN TOTAL (short items keep everything). */
export const buildContext = (items, maxTokens = 2000) => {
	if (!items.length) return "";
	let budget = maxTokens * 4;
	const order = items.map((_, i) => i).sort((a, b) => items[a].text.length - items[b].text.length);
	const allowance = new Array(items.length).fill(0);
	let left = order.length;
	for (const i of order) {
		const share = Math.floor(budget / left--);
		allowance[i] = Math.min(items[i].text.length, share);
		budget -= allowance[i];
	}
	const parts = items.map((it, i) => {
		let text = it.text;
		let note = "";
		if (text.length > allowance[i]) {
			text = text.slice(0, Math.max(0, allowance[i] - 40));
			note = `\n[trimmed to fit the ${maxTokens}-token context cap. Use read_table for all rows.]`;
		}
		const tag = it.kind === "note" ? "table" : it.kind;
		const attrs = it.kind === "selection" ? `table_id="${it.noteId}" title="${it.title}"` : `id="${it.noteId}" title="${it.title}"`;
		return `<${tag} ${attrs}>\n${text}${note}\n</${tag}>`;
	});
	return `<context>\n${parts.join("\n")}\n</context>`;
};

export { uid };
