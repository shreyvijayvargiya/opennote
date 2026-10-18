/**
 * RowTabs table model.
 *
 * A table is stored in IndexedDB as a normal record of the `notes` store:
 *   { id, title, icon, parentId, isFolder, content: <JSON string of TableData> }
 * so the sidebar tree, tabs, split view, drag & drop and the assistant all work on it.
 *
 *   TableData = { v: 1, columns: Column[], rows: Row[] }
 *   Column    = { id, name, type, options?, lang?, multi? }
 *   Row       = { id, cells: { [columnId]: value } }
 */
import {
	TextIcon,
	HashtagIcon,
	CheckmarkSquare02Icon,
	Calendar01Icon,
	Tag01Icon,
	Link01Icon,
	Table02Icon,
	SmartPhone01Icon,
	SlidersHorizontalIcon,
	PinCodeIcon,
	Attachment01Icon,
	StarIcon,
	UserIcon,
	SparklesIcon,
	SourceCodeIcon,
	Image01Icon,
} from "@hugeicons/core-free-icons";

/* ---------- limits (everything lives in the browser, so keep it sane) ---------- */
export const LIMITS = {
	TABLES: 200, // tables per browser
	COLUMNS: 40, // columns per table
	ROWS: 2000, // rows per table
	FILE_BYTES: 2 * 1024 * 1024, // one attached file
	FILES_PER_CELL: 5,
	TABLE_BYTES: 20 * 1024 * 1024, // serialized size of one table
	IMPORT_BYTES: 15 * 1024 * 1024, // import file size
};

export const uid = () =>
	(globalThis.crypto?.randomUUID?.() || `${Date.now()}${Math.random()}`).replace(/-/g, "").slice(0, 8);

/* ---------- chip colors ---------- */
export const CHIP_COLORS = [
	{ id: "gray", dot: "#71717a", fg: "#3f3f46", fgDark: "#d4d4d8" },
	{ id: "red", dot: "#ef4444", fg: "#b91c1c", fgDark: "#fca5a5" },
	{ id: "orange", dot: "#f97316", fg: "#c2410c", fgDark: "#fdba74" },
	{ id: "amber", dot: "#f59e0b", fg: "#b45309", fgDark: "#fcd34d" },
	{ id: "green", dot: "#22c55e", fg: "#15803d", fgDark: "#86efac" },
	{ id: "teal", dot: "#14b8a6", fg: "#0f766e", fgDark: "#5eead4" },
	{ id: "blue", dot: "#3b82f6", fg: "#1d4ed8", fgDark: "#93c5fd" },
	{ id: "indigo", dot: "#6366f1", fg: "#4338ca", fgDark: "#a5b4fc" },
	{ id: "purple", dot: "#a855f7", fg: "#7e22ce", fgDark: "#d8b4fe" },
	{ id: "pink", dot: "#ec4899", fg: "#be185d", fgDark: "#f9a8d4" },
];
export const chipColor = (id) => CHIP_COLORS.find((c) => c.id === id) || CHIP_COLORS[0];
export const chipStyle = (id, dark) => {
	const c = chipColor(id);
	return { backgroundColor: `${c.dot}29`, color: dark ? c.fgDark : c.fg };
};
const COLOR_CYCLE = ["blue", "green", "amber", "purple", "pink", "teal", "orange", "indigo", "red", "gray"];
export const makeOption = (label, index = 0) => ({
	id: uid(),
	label,
	color: COLOR_CYCLE[index % COLOR_CYCLE.length],
});

/* ---------- cartoon avatars (emoji on a color, works offline) ---------- */
export const AVATARS = [
	["fox", "🦊", "#fed7aa"], ["panda", "🐼", "#e4e4e7"], ["cat", "🐱", "#fde68a"], ["dog", "🐶", "#fecaca"],
	["koala", "🐨", "#d4d4d8"], ["lion", "🦁", "#fcd34d"], ["frog", "🐸", "#bbf7d0"], ["monkey", "🐵", "#fed7aa"],
	["unicorn", "🦄", "#fbcfe8"], ["octopus", "🐙", "#ddd6fe"], ["owl", "🦉", "#e7e5e4"], ["penguin", "🐧", "#bfdbfe"],
	["tiger", "🐯", "#fdba74"], ["bear", "🐻", "#fed7aa"], ["rabbit", "🐰", "#fbcfe8"], ["robot", "🤖", "#c7d2fe"],
	["alien", "👽", "#bbf7d0"], ["ghost", "👻", "#e5e7eb"], ["ninja", "🥷", "#d4d4d8"], ["astronaut", "🧑‍🚀", "#bae6fd"],
	["wizard", "🧙", "#ddd6fe"], ["dino", "🦖", "#bef264"], ["whale", "🐳", "#bae6fd"], ["bee", "🐝", "#fde68a"],
];
export const avatarOf = (id) => AVATARS.find((a) => a[0] === id);

export const CODE_LANGS = [
	["javascript", "JavaScript"], ["typescript", "TypeScript"], ["python", "Python"], ["html", "HTML"],
	["css", "CSS"], ["sql", "SQL"], ["json", "JSON"], ["bash", "Bash"], ["plaintext", "Plain text"],
];

export const DIAL_CODES = [
	["+1", "US/CA"], ["+44", "UK"], ["+91", "IN"], ["+61", "AU"], ["+49", "DE"], ["+33", "FR"], ["+34", "ES"],
	["+39", "IT"], ["+55", "BR"], ["+52", "MX"], ["+81", "JP"], ["+86", "CN"], ["+971", "AE"], ["+65", "SG"],
	["+27", "ZA"], ["+234", "NG"], ["+82", "KR"], ["+31", "NL"], ["+46", "SE"], ["+90", "TR"],
];

/* ---------- column types ---------- */
export const COLUMN_TYPES = [
	{ id: "text", label: "Text", icon: TextIcon, width: 220, hint: "Plain text, bold, italic and links" },
	{ id: "number", label: "Number", icon: HashtagIcon, width: 120, hint: "Numbers, prices, counts" },
	{ id: "checkbox", label: "Checkbox", icon: CheckmarkSquare02Icon, width: 90, hint: "Done / not done" },
	{ id: "date", label: "Date", icon: Calendar01Icon, width: 150, hint: "Pick from a calendar" },
	{ id: "chips", label: "Chips", icon: Tag01Icon, width: 170, hint: "Colored labels you can rename" },
	{ id: "link", label: "Link", icon: Link01Icon, width: 220, hint: "Clickable URL" },
	{ id: "table", label: "Table link", icon: Table02Icon, width: 190, hint: "Link to another table" },
	{ id: "phone", label: "Phone", icon: SmartPhone01Icon, width: 190, hint: "Country code + number" },
	{ id: "slider", label: "Slider", icon: SlidersHorizontalIcon, width: 170, hint: "0–100 progress" },
	{ id: "otp", label: "OTP / PIN", icon: PinCodeIcon, width: 170, hint: "6-digit code" },
	{ id: "files", label: "Files", icon: Attachment01Icon, width: 190, hint: "Zip, CSV, PDF… (max 2 MB each)" },
	{ id: "rating", label: "Rating", icon: StarIcon, width: 140, hint: "1–5 stars" },
	{ id: "avatar", label: "Avatar", icon: UserIcon, width: 110, hint: "Cartoon avatar" },
	{ id: "icon", label: "Icon", icon: SparklesIcon, width: 100, hint: "Icon or emoji" },
	{ id: "code", label: "Code", icon: SourceCodeIcon, width: 280, hint: "Syntax-highlighted snippet" },
	{ id: "image", label: "Image", icon: Image01Icon, width: 120, hint: "Upload a picture" },
];
export const typeOf = (id) => COLUMN_TYPES.find((t) => t.id === id) || COLUMN_TYPES[0];

export const DEFAULT_CHIP_OPTIONS = ["To do", "In progress", "Done"];

export const makeColumn = (name, type = "text", extra = {}) => {
	const col = { id: uid(), name, type, ...extra };
	if (type === "chips" && !col.options) col.options = DEFAULT_CHIP_OPTIONS.map((l, i) => makeOption(l, i));
	if (type === "code" && !col.lang) col.lang = "javascript";
	return col;
};
export const makeRow = (cells = {}) => ({ id: uid(), cells });

export const emptyTable = () => ({
	v: 1,
	columns: [makeColumn("Name"), makeColumn("Status", "chips"), makeColumn("Notes")],
	rows: [makeRow(), makeRow(), makeRow()],
});

/* ---------- (de)serialize ---------- */
export const parseTable = (content) => {
	if (content && typeof content === "object") return content;
	try {
		const t = JSON.parse(content || "");
		if (t && Array.isArray(t.columns) && Array.isArray(t.rows)) return t;
	} catch {}
	return { v: 1, columns: [], rows: [] };
};
export const serializeTable = (t) => JSON.stringify({ v: 1, columns: t.columns, rows: t.rows });
export const tableBytes = (t) => serializeTable(t).length;

/* ---------- value helpers ---------- */
export const textValue = (v) => (v && typeof v === "object" && !Array.isArray(v) && "t" in v ? v.t : v);

export const isEmptyValue = (v) => {
	const x = textValue(v);
	return x == null || x === "" || x === false || (Array.isArray(x) && x.length === 0);
};

/** Plain-text form of a cell (search, sort, export, AI). `tables` is a Map id -> record. */
export const cellText = (col, value, tables) => {
	const v = textValue(value);
	if (v == null || v === "") return "";
	switch (col.type) {
		case "checkbox":
			return v ? "Yes" : "No";
		case "chips":
			return col.options?.find((o) => o.id === v)?.label ?? "";
		case "table":
			return tables?.get?.(v)?.title || (v ? `table ${v}` : "");
		case "files":
			return Array.isArray(v) ? v.map((f) => f.name).join(", ") : "";
		case "image":
			return v?.name || "image";
		case "avatar":
			return avatarOf(v)?.[0] ?? "";
		case "icon":
			return String(v).split(":").pop();
		case "rating":
			return v ? `${v}/5` : "";
		case "slider":
			return `${v}%`;
		default:
			return String(v);
	}
};
