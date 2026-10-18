import React, { useMemo, useRef, useState } from "react";
import { FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { useApp } from "../../context/AppContext";
import { IMPORT_ACCEPT, matrixToTable, readImportFile } from "../../tables/import";
import { createTable } from "../../tables/tableService";
import { LIMITS, cellText, typeOf } from "../../tables/schema";
import { cn } from "../../utils/cn";

/** Import CSV, TSV, Excel, JSON, Markdown or HTML tables as a new table. */
const ImportModal = () => {
	const app = useApp();
	const input = useRef(null);
	const [drag, setDrag] = useState(false);
	const [busy, setBusy] = useState(false);
	const [source, setSource] = useState(null); // { title, matrix, fileName }
	const [name, setName] = useState("");
	const [header, setHeader] = useState(true);

	const parsed = useMemo(() => (source ? matrixToTable(source.matrix, { header }) : null), [source, header]);

	const reset = () => {
		setSource(null);
		setName("");
		setHeader(true);
	};
	const close = (open) => {
		app.setImportOpen(open);
		if (!open) reset();
	};
	const load = async (file) => {
		if (!file) return;
		setBusy(true);
		try {
			const res = await readImportFile(file);
			setSource({ ...res, fileName: file.name });
			setName(res.title);
		} catch (e) {
			toast.error(e.message || "Could not read that file");
		} finally {
			setBusy(false);
		}
	};
	const create = async () => {
		try {
			const rec = await createTable({ title: name.trim() || source.title, table: parsed.table });
			close(false);
			app.openNote(rec.id);
			toast.success(`Imported ${parsed.table.rows.length} rows`);
		} catch (e) {
			toast.error(e.message);
		}
	};

	return (
		<Dialog open={app.importOpen} onOpenChange={close}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Import a table</DialogTitle>
					<DialogDescription>CSV, TSV, Excel (.xlsx), JSON, Markdown or HTML. Columns and their types are detected for you. Nothing leaves your browser.</DialogDescription>
				</DialogHeader>

				{!source ? (
					<div
						onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
						onDragLeave={() => setDrag(false)}
						onDrop={(e) => { e.preventDefault(); setDrag(false); load(e.dataTransfer.files?.[0]); }}
						onClick={() => input.current?.click()}
						className={cn("flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-14 text-center transition-colors", drag ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30" : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50")}
					>
						<Upload className="h-6 w-6 text-zinc-400" />
						<p className="text-sm font-medium">{busy ? "Reading file…" : "Drop a file here or click to browse"}</p>
						<p className="text-xs text-zinc-400">.csv .tsv .xlsx .xls .json .md .html · up to 15 MB · max {LIMITS.ROWS.toLocaleString()} rows × {LIMITS.COLUMNS} columns</p>
						<input ref={input} type="file" accept={IMPORT_ACCEPT} hidden onChange={(e) => { load(e.target.files?.[0]); e.target.value = ""; }} />
					</div>
				) : (
					<div className="space-y-3">
						<div className="flex items-center gap-2 text-xs text-zinc-500"><FileSpreadsheet className="h-4 w-4" /> {source.fileName} · {source.matrix.length.toLocaleString()} lines</div>
						<div className="flex items-center gap-3">
							<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Table name" className="h-9 flex-1 rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
							<label className="flex cursor-pointer items-center gap-2 text-xs"><input type="checkbox" checked={header} onChange={(e) => setHeader(e.target.checked)} /> First row is the header</label>
						</div>
						<div className="hide-scrollbar max-h-64 overflow-auto rounded-xl border">
							<table className="w-full border-collapse text-xs">
								<thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900">
									<tr>{parsed.table.columns.map((c) => <th key={c.id} className="whitespace-nowrap border-b px-3 py-2 text-left font-semibold">{c.name} <span className="font-normal text-zinc-400">· {typeOf(c.type).label}</span></th>)}</tr>
								</thead>
								<tbody>
									{parsed.table.rows.slice(0, 6).map((r) => (
										<tr key={r.id} className="border-b last:border-0">{parsed.table.columns.map((c) => <td key={c.id} className="max-w-[12rem] truncate px-3 py-1.5">{cellText(c, r.cells[c.id])}</td>)}</tr>
									))}
								</tbody>
							</table>
						</div>
						<p className="text-xs text-zinc-500">
							{parsed.table.rows.length.toLocaleString()} rows × {parsed.table.columns.length} columns will be imported.
							{(parsed.truncated.rows > 0 || parsed.truncated.cols > 0) && (
								<span className="text-amber-600 dark:text-amber-400"> Over the limit: skipping {parsed.truncated.rows} rows and {parsed.truncated.cols} columns.</span>
							)}
						</p>
					</div>
				)}

				<DialogFooter>
					{source && <button type="button" onClick={reset} className="flex h-8 items-center rounded-xl border border-zinc-200 bg-zinc-100 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">Choose another file</button>}
					{source && <button type="button" onClick={create} className="flex h-8 items-center rounded-xl border border-indigo-300 bg-indigo-50 px-4 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/50 dark:bg-indigo-950/40 dark:text-indigo-200">Create table</button>}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default ImportModal;
