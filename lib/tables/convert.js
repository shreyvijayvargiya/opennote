import { cellText, isEmptyValue, makeOption, textValue } from "./schema";

/** Change a column's type and convert its values as sensibly as possible. */
export const convertColumn = (table, colId, type, tables) => {
	const col = table.columns.find((c) => c.id === colId);
	if (!col || col.type === type) return table;
	const next = { ...col, type };
	delete next.options;
	delete next.lang;
	let rows = table.rows;

	if (type === "chips") {
		// every distinct value becomes a colored option
		const labels = [...new Set(rows.map((r) => cellText(col, r.cells[colId], tables)).filter(Boolean))].slice(0, 30);
		next.options = labels.map((l, i) => makeOption(l, i));
		rows = rows.map((r) => {
			const label = cellText(col, r.cells[colId], tables);
			return setCell(r, colId, next.options.find((o) => o.label === label)?.id);
		});
	} else if (type === "code") {
		next.lang = "javascript";
		rows = rows.map((r) => setCell(r, colId, cellText(col, r.cells[colId], tables) || undefined));
	} else {
		rows = rows.map((r) => setCell(r, colId, convertValue(col, r.cells[colId], type, tables)));
	}
	return { ...table, columns: table.columns.map((c) => (c.id === colId ? next : c)), rows };
};

const setCell = (row, colId, value) => {
	const cells = { ...row.cells };
	if (value === undefined || value === null || value === "") delete cells[colId];
	else cells[colId] = value;
	return { ...row, cells };
};

const convertValue = (col, value, type, tables) => {
	if (isEmptyValue(value)) return undefined;
	const text = cellText(col, value, tables);
	switch (type) {
		case "number": {
			const n = Number(String(text).replace(/[^\d.-]/g, ""));
			return Number.isNaN(n) || text === "" ? undefined : n;
		}
		case "slider": {
			const n = Number(String(text).replace(/[^\d.-]/g, ""));
			return Number.isNaN(n) ? undefined : Math.max(0, Math.min(100, n));
		}
		case "rating": {
			const n = Number(String(text).replace(/[^\d.]/g, ""));
			return Number.isNaN(n) || !n ? undefined : Math.max(1, Math.min(5, Math.round(n)));
		}
		case "checkbox":
			return /^(true|yes|y|1|x|done|✓|checked)$/i.test(text) ? true : undefined;
		case "date": {
			const d = new Date(text);
			return Number.isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
		}
		case "text":
		case "link":
		case "phone":
			return typeof textValue(value) === "object" ? undefined : text || undefined;
		case "otp":
			return text.replace(/\D/g, "").slice(0, 6) || undefined;
		default:
			return undefined; // table, files, avatar, icon, image can't be derived from text
	}
};

/** Best-guess type for imported data columns. */
export const inferType = (values) => {
	const v = values.map((x) => String(x ?? "").trim()).filter(Boolean);
	if (!v.length) return "text";
	const all = (re) => v.every((x) => re.test(x));
	if (all(/^(true|false|yes|no)$/i)) return "checkbox";
	// long digit strings are phone numbers (no thousands separators), short ones are numbers
	if (all(/^\+?\d[\d\s().-]{8,16}$/) && v.every((x) => x.replace(/\D/g, "").length >= 10) && !v.some((x) => /^-?\d+\.\d+$/.test(x))) return "phone";
	if (all(/^-?\d+(\.\d+)?$/)) return v.some((x) => /^0\d+$/.test(x)) ? "text" : "number";
	if (all(/^\d{4}-\d{2}-\d{2}([T ].*)?$/) || all(/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/)) return "date";
	if (all(/^https?:\/\/\S+$/i)) return "link";
	if (all(/^\+?[\d\s().-]{7,18}$/) && v.some((x) => /\d{7,}/.test(x.replace(/\D/g, "")))) return "phone";
	const distinct = new Set(v);
	if (v.length >= 6 && distinct.size <= Math.min(8, Math.ceil(v.length / 3)) && v.every((x) => x.length <= 24)) return "chips";
	return "text";
};
