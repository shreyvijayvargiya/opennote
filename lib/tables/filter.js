import { cellText, isEmptyValue } from "./schema";

const NUM = ["number", "slider", "rating"];
const TEXTY = ["text", "link", "phone", "otp", "code", "files", "table", "icon", "avatar", "image"];

export const OPERATORS = (type) => {
	if (NUM.includes(type)) return [["eq", "="], ["neq", "≠"], ["gt", ">"], ["lt", "<"], ["gte", "≥"], ["lte", "≤"], ["empty", "is empty"], ["filled", "is not empty"]];
	if (type === "date") return [["eq", "is"], ["lt", "is before"], ["gt", "is after"], ["empty", "is empty"], ["filled", "is not empty"]];
	if (type === "checkbox") return [["checked", "is checked"], ["unchecked", "is unchecked"]];
	if (type === "chips") return [["is", "is"], ["isnot", "is not"], ["empty", "is empty"], ["filled", "is not empty"]];
	if (["avatar", "image", "icon", "files"].includes(type)) return [["empty", "is empty"], ["filled", "is not empty"]];
	return [["contains", "contains"], ["eq", "is"], ["starts", "starts with"], ["empty", "is empty"], ["filled", "is not empty"]];
};
export const needsValue = (op) => !["empty", "filled", "checked", "unchecked"].includes(op);

export const matchRule = (col, raw, rule, tables) => {
	const { op, value } = rule;
	if (op === "empty") return isEmptyValue(raw);
	if (op === "filled") return !isEmptyValue(raw);
	if (op === "checked") return Boolean(raw);
	if (op === "unchecked") return !raw;
	if (value === "" || value == null) return true;
	if (col.type === "chips") return op === "is" ? raw === value : raw !== value;
	if (NUM.includes(col.type)) {
		const a = Number(raw), b = Number(value);
		if (raw == null || Number.isNaN(a) || Number.isNaN(b)) return false;
		return { eq: a === b, neq: a !== b, gt: a > b, lt: a < b, gte: a >= b, lte: a <= b }[op];
	}
	if (col.type === "date") {
		if (!raw) return false;
		return { eq: raw === value, lt: raw < value, gt: raw > value }[op];
	}
	const t = cellText(col, raw, tables).toLowerCase();
	const q = String(value).toLowerCase();
	return op === "eq" ? t === q : op === "starts" ? t.startsWith(q) : t.includes(q);
};

export const defaultRule = (col) => {
	const op = OPERATORS(col.type)[0][0];
	return { id: Math.random().toString(36).slice(2, 8), col: col.id, op, value: "" };
};
export { TEXTY };
