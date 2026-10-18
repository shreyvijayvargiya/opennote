/** Table -> Markdown / CSV / HTML / JSON / SQL / React / PDF. Pure functions + download helpers. */
import { cellText, textValue } from "./schema";

const slug = (s, fallback = "col") =>
	(String(s || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || fallback).replace(/^(\d)/, "_$1");

const uniqueSlugs = (columns) => {
	const seen = new Map();
	return columns.map((c) => {
		const base = slug(c.name);
		const n = (seen.get(base) || 0) + 1;
		seen.set(base, n);
		return n === 1 ? base : `${base}_${n}`;
	});
};

const grid = (table, tables) =>
	table.rows.map((r) => table.columns.map((c) => cellText(c, r.cells[c.id], tables)));

export const tableToMarkdown = (table, title, tables) => {
	if (!table.columns.length) return title ? `# ${title}\n` : "";
	const esc = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, "<br>");
	const head = `| ${table.columns.map((c) => esc(c.name)).join(" | ")} |`;
	const sep = `| ${table.columns.map(() => "---").join(" | ")} |`;
	const body = grid(table, tables).map((r) => `| ${r.map(esc).join(" | ")} |`);
	return [title ? `# ${title}\n` : "", head, sep, ...body].filter((x) => x !== "").join("\n") + "\n";
};

export const tableToCsv = (table, tables) => {
	const q = (s) => (/[",\n\r]/.test(s) ? `"${String(s).replace(/"/g, '""')}"` : String(s));
	return [table.columns.map((c) => q(c.name)).join(","), ...grid(table, tables).map((r) => r.map(q).join(","))].join("\n");
};

export const tableToJson = (table, tables) => {
	const keys = uniqueSlugs(table.columns);
	return JSON.stringify(
		table.rows.map((r) =>
			Object.fromEntries(
				table.columns.map((c, i) => {
					const v = textValue(r.cells[c.id]);
					const out = ["number", "slider", "rating"].includes(c.type) && v !== "" && v != null ? Number(v) : c.type === "checkbox" ? Boolean(v) : cellText(c, v, tables);
					return [keys[i], out];
				}),
			),
		),
		null,
		2,
	);
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const tableToHtml = (table, title, tables) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${esc(title || "Table")}</title>
<style>body{font-family:Inter,system-ui,sans-serif;margin:32px;color:#18181b}h1{font-size:20px}table{border-collapse:collapse;width:100%;font-size:13px}
th,td{border:1px solid #e4e4e7;padding:8px 12px;text-align:left}th{background:#fafafa;font-weight:600}tr:nth-child(even) td{background:#fcfcfc}</style></head>
<body><h1>${esc(title || "Table")}</h1>
<table><thead><tr>${table.columns.map((c) => `<th>${esc(c.name)}</th>`).join("")}</tr></thead>
<tbody>${grid(table, tables).map((r) => `<tr>${r.map((v) => `<td>${esc(v)}</td>`).join("")}</tr>`).join("\n")}</tbody></table>
<p style="color:#a1a1aa;font-size:11px;margin-top:16px">Exported from RowTabs</p></body></html>
`;

const SQL_TYPES = {
	text: "TEXT", number: "NUMERIC", checkbox: "BOOLEAN", date: "DATE", chips: "TEXT", link: "TEXT", table: "INTEGER",
	phone: "TEXT", slider: "SMALLINT", otp: "VARCHAR(6)", files: "TEXT", rating: "SMALLINT", avatar: "TEXT",
	icon: "TEXT", code: "TEXT", image: "TEXT",
};
const sqlLit = (c, v, tables) => {
	const x = textValue(v);
	if (x == null || x === "") return "NULL";
	if (c.type === "checkbox") return x ? "TRUE" : "FALSE";
	if (["number", "slider", "rating"].includes(c.type) && !Number.isNaN(Number(x))) return String(Number(x));
	if (c.type === "table") return String(x);
	return `'${cellText(c, x, tables).replace(/'/g, "''")}'`;
};

export const tableToSql = (table, title, tables) => {
	const name = slug(title, "my_table");
	const keys = uniqueSlugs(table.columns);
	const cols = table.columns.map(
		(c, i) =>
			`  ${keys[i]} ${SQL_TYPES[c.type] || "TEXT"}${i < table.columns.length - 1 ? "," : ""}${c.type === "chips" && c.options?.length ? ` -- ${c.options.map((o) => o.label).join(" | ")}` : ""}`,
	);
	const create = `CREATE TABLE ${name} (\n  id SERIAL PRIMARY KEY${cols.length ? "," : ""}\n${cols.join("\n")}\n);`;
	if (!table.rows.length) return create;
	const insert = `INSERT INTO ${name} (${keys.join(", ")}) VALUES\n${table.rows
		.map((r) => `  (${table.columns.map((c) => sqlLit(c, r.cells[c.id], tables)).join(", ")})`)
		.join(",\n")};`;
	return `${create}\n\n${insert}\n`;
};

export const tableToReact = (table, title, tables) => {
	const keys = uniqueSlugs(table.columns);
	const data = JSON.parse(tableToJson(table, tables));
	const comp = (slug(title, "data_table").split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join("")) || "DataTable";
	return `import React from "react";

const columns = ${JSON.stringify(table.columns.map((c, i) => ({ key: keys[i], label: c.name })), null, 2)};

const rows = ${JSON.stringify(data, null, 2)};

export default function ${/^\d/.test(comp) ? `T${comp}` : comp}() {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-4 py-3 font-semibold">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-zinc-100">
              {columns.map((c) => (
                <td key={c.key} className="px-4 py-3">{String(row[c.key] ?? "")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
`;
};

/* ---------- downloads ---------- */
export const downloadBlob = (filename, blob) => {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 2000);
};
export const downloadText = (filename, mime, text) => downloadBlob(filename, new Blob([text], { type: `${mime};charset=utf-8` }));

const fileSlug = (title) => slug(title, "table").replace(/_/g, "-");

export const exportTable = async (format, table, title, tables) => {
	const base = fileSlug(title);
	if (format === "csv") return downloadText(`${base}.csv`, "text/csv", tableToCsv(table, tables));
	if (format === "md") return downloadText(`${base}.md`, "text/markdown", tableToMarkdown(table, title, tables));
	if (format === "html") return downloadText(`${base}.html`, "text/html", tableToHtml(table, title, tables));
	if (format === "json") return downloadText(`${base}.json`, "application/json", tableToJson(table, tables));
	if (format === "sql") return downloadText(`${base}.sql`, "text/plain", tableToSql(table, title, tables));
	if (format === "pdf") {
		const [{ jsPDF }, autoTable] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
		const doc = new jsPDF({ orientation: table.columns.length > 5 ? "landscape" : "portrait" });
		doc.setFontSize(14);
		doc.text(title || "Table", 14, 16);
		(autoTable.default || autoTable.autoTable)(doc, {
			startY: 22,
			head: [table.columns.map((c) => c.name)],
			body: grid(table, tables),
			styles: { fontSize: 8, cellPadding: 2 },
			headStyles: { fillColor: [244, 244, 245], textColor: [39, 39, 42] },
		});
		return doc.save(`${base}.pdf`);
	}
};
