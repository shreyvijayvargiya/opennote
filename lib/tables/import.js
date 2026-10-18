/** Import CSV / TSV / Excel / JSON / Markdown / HTML tables into RowTabs table data. */
import Papa from "papaparse";
import { inferType } from "./convert";
import { LIMITS, makeColumn, makeOption, makeRow } from "./schema";

export const IMPORT_ACCEPT = ".csv,.tsv,.txt,.xlsx,.xls,.ods,.json,.md,.markdown,.html,.htm";

const ext = (name) => (name.split(".").pop() || "").toLowerCase();

const matrixFromMarkdown = (text) => {
	const lines = text.split(/\r?\n/).filter((l) => l.trim().startsWith("|"));
	const rows = lines.filter((l) => !/^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l)).map((l) => l.trim().replace(/^\||\|$/g, "").split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, "|")));
	return rows;
};

const matrixFromJson = (text) => {
	const data = JSON.parse(text);
	const arr = Array.isArray(data) ? data : Array.isArray(data.rows) ? data.rows : Object.values(data).find(Array.isArray);
	if (!Array.isArray(arr) || !arr.length) throw new Error("JSON must be an array of objects (or of arrays)");
	if (Array.isArray(arr[0])) return arr.map((r) => r.map((x) => (x == null ? "" : typeof x === "object" ? JSON.stringify(x) : String(x))));
	const keys = [...new Set(arr.flatMap((o) => Object.keys(o)))];
	return [keys, ...arr.map((o) => keys.map((k) => (o[k] == null ? "" : typeof o[k] === "object" ? JSON.stringify(o[k]) : String(o[k]))))];
};

const matrixFromHtml = (text) => {
	const doc = new DOMParser().parseFromString(text, "text/html");
	const t = doc.querySelector("table");
	if (!t) throw new Error("No <table> found in that HTML file");
	return [...t.querySelectorAll("tr")].map((tr) => [...tr.children].map((c) => c.textContent.trim()));
};

/** File -> { title, matrix: string[][] } (first row is usually the header). */
export const readImportFile = async (file) => {
	if (file.size > LIMITS.IMPORT_BYTES) throw new Error("File is over 15 MB");
	const e = ext(file.name);
	const title = file.name.replace(/\.[^.]+$/, "");
	let matrix;
	if (["xlsx", "xls", "ods"].includes(e)) {
		const XLSX = await import("xlsx");
		const wb = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
		const sheet = wb.Sheets[wb.SheetNames[0]];
		matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "", dateNF: "yyyy-mm-dd" });
	} else {
		const text = await file.text();
		if (e === "json") matrix = matrixFromJson(text);
		else if (e === "md" || e === "markdown") matrix = matrixFromMarkdown(text);
		else if (e === "html" || e === "htm") matrix = matrixFromHtml(text);
		else {
			const res = Papa.parse(text, { skipEmptyLines: "greedy", delimiter: e === "tsv" ? "\t" : "" });
			matrix = res.data;
		}
	}
	matrix = matrix.filter((r) => r.some((c) => String(c ?? "").trim() !== ""));
	if (!matrix.length) throw new Error("That file has no rows");
	return { title, matrix: matrix.map((r) => r.map((c) => String(c ?? ""))) };
};

const toIsoDate = (s) => {
	const d = new Date(s);
	return Number.isNaN(d.getTime()) ? undefined : new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

/** matrix -> table data with inferred column types. */
export const matrixToTable = (matrix, { header = true } = {}) => {
	const width = Math.min(LIMITS.COLUMNS, Math.max(...matrix.map((r) => r.length)));
	const names = Array.from({ length: width }, (_, i) => (header ? String(matrix[0][i] ?? "").trim() : "") || `Column ${i + 1}`);
	const seen = new Map();
	const unique = names.map((n) => {
		const k = (seen.get(n) || 0) + 1;
		seen.set(n, k);
		return k === 1 ? n : `${n} ${k}`;
	});
	const body = (header ? matrix.slice(1) : matrix).slice(0, LIMITS.ROWS);
	const columns = unique.map((name, i) => {
		const type = inferType(body.map((r) => r[i]));
		const col = makeColumn(name, type, type === "chips" ? { options: [] } : {});
		if (type === "chips") col.options = [...new Set(body.map((r) => String(r[i] ?? "").trim()).filter(Boolean))].map((l, k) => makeOption(l, k));
		return col;
	});
	const rows = body.map((r) => {
		const cells = {};
		columns.forEach((c, i) => {
			const raw = String(r[i] ?? "").trim();
			if (!raw) return;
			if (c.type === "number") cells[c.id] = Number(raw);
			else if (c.type === "checkbox") cells[c.id] = /^(true|yes)$/i.test(raw) || undefined;
			else if (c.type === "date") cells[c.id] = toIsoDate(raw);
			else if (c.type === "chips") cells[c.id] = c.options.find((o) => o.label === raw)?.id;
			else cells[c.id] = raw;
			if (cells[c.id] === undefined) delete cells[c.id];
		});
		return makeRow(cells);
	});
	const totalRows = (header ? matrix.length - 1 : matrix.length);
	const totalCols = Math.max(...matrix.map((r) => r.length));
	return { table: { v: 1, columns, rows }, truncated: { rows: Math.max(0, totalRows - rows.length), cols: Math.max(0, totalCols - width) } };
};
