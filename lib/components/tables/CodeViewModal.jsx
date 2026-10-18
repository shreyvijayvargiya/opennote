import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { highlightCode } from "../../tables/highlight";
import { tableToCsv, tableToHtml, tableToJson, tableToMarkdown, tableToReact, tableToSql } from "../../tables/format";
import { cn } from "../../utils/cn";

const FORMATS = [
	["sql", "SQL", "sql", (t, title, m) => tableToSql(t, title, m)],
	["react", "React", "javascript", (t, title, m) => tableToReact(t, title, m)],
	["json", "JSON", "json", (t, title, m) => tableToJson(t, m)],
	["md", "Markdown", "plaintext", (t, title, m) => tableToMarkdown(t, title, m)],
	["html", "HTML", "html", (t, title, m) => tableToHtml(t, title, m)],
	["csv", "CSV", "plaintext", (t, title, m) => tableToCsv(t, m)],
];

/** "View as code": the table as SQL, React, JSON, Markdown, HTML or CSV, ready to copy. */
const CodeViewModal = ({ open, onOpenChange, table, title, tables }) => {
	const [fmt, setFmt] = useState("sql");
	const [copied, setCopied] = useState(false);
	const [, label, lang, build] = FORMATS.find((f) => f[0] === fmt);
	const code = open ? build(table, title, tables) : "";
	const copy = async () => {
		await navigator.clipboard.writeText(code);
		setCopied(true);
		toast.success(`${label} copied`);
		setTimeout(() => setCopied(false), 1500);
	};
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl">
				<DialogHeader>
					<DialogTitle>View “{title || "Untitled"}” as code</DialogTitle>
					<DialogDescription>Copy the whole table into your database, app or docs.</DialogDescription>
				</DialogHeader>
				<div className="flex items-center justify-between gap-2">
					<div className="flex flex-wrap gap-1">
						{FORMATS.map(([id, name]) => (
							<button
								key={id}
								type="button"
								onClick={() => setFmt(id)}
								className={cn(
									"rounded-lg border border-transparent px-2.5 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800",
									fmt === id && "border-zinc-200 bg-zinc-100 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100",
								)}
							>
								{name}
							</button>
						))}
					</div>
					<button type="button" onClick={copy} className="flex h-8 items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-100 px-3 text-xs font-medium text-zinc-800 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700">
						{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy
					</button>
				</div>
				<pre className="hide-scrollbar max-h-[55vh] overflow-auto rounded-xl border bg-zinc-50 p-4 font-mono text-xs leading-relaxed dark:bg-zinc-900" dangerouslySetInnerHTML={{ __html: highlightCode(code, lang) }} />
			</DialogContent>
		</Dialog>
	);
};

export default CodeViewModal;
